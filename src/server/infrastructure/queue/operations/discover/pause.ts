import { JOB_NAMES } from "@/server/infrastructure/queue/constants";
import { backgroundJobsQueue, discoverQueue } from "@/server/infrastructure/queue/queues";
import { getAppRedis } from "@/server/infrastructure/redis/clients";

// # discover 队列熔断：撞 GitHub 限流时暂停整队列，到点由延迟 job 触发 resume
// > resume job 投到 background-jobs 队列（避免 discover 暂停时 resume 任务也卡死，复用旧解耦设计）
// > resumeAt 存 Redis 供日志/排查；resume 动作本身由 BullMQ 延迟 job 驱动，worker 重启不丢

// Redis 存恢复时间的 key（仅供日志/排查，resume 不依赖它）
const DISCOVER_RESUME_AT_REDIS_KEY = "discover:resumeAt";

// 固定 jobId：多次暂停只保留一个 resume 任务，不会堆积
const DISCOVER_RESUME_JOB_ID = "discover-resume";

type PauseDiscoverUntilOptions = {
	// 恢复时刻（Unix ms），由 GitHub 响应头算出
	resumeAtMs: number;
};

// 撞限流时调用：幂等暂停 discover 队列 + 投一条延迟 resume job 到 background-jobs
export const pauseDiscoverUntil = async ({
	resumeAtMs,
}: PauseDiscoverUntilOptions): Promise<void> => {
	const now = Date.now();
	const delay = Math.max(resumeAtMs - now, 0);
	const redis = getAppRedis();

	// 幂等：已暂停时不重复 pause / 重投 resume job（单并发下二次撞限流是极窄竞态，即便早恢复也只是再撞一次→再暂停，可自我纠正）
	const isPaused = await discoverQueue.isPaused();
	if (isPaused) {
		// 早恢复优先：已记录的 resumeAt 不晚于本次就保留原调度，避免后到的更长延迟推迟已有恢复
		const prevRaw = await redis.get(DISCOVER_RESUME_AT_REDIS_KEY);
		const prev = prevRaw ? Number.parseInt(prevRaw, 10) : null;
		if (prev !== null && prev <= resumeAtMs) return;
		await redis.set(DISCOVER_RESUME_AT_REDIS_KEY, String(resumeAtMs), "EX", 7200);
		return;
	}

	// TTL 2 小时兜底，避免 key 永留（恢复异常没清掉的极端情况）
	await redis.set(DISCOVER_RESUME_AT_REDIS_KEY, String(resumeAtMs), "EX", 7200);
	await discoverQueue.pause();
	// 用 BullMQ 延迟 job 触发 resume：自带持久化，worker 重启后仍按 delay 调度
	await backgroundJobsQueue.add(
		JOB_NAMES.discoverResume,
		{},
		{
			delay,
			jobId: DISCOVER_RESUME_JOB_ID,
		},
	);
	console.warn("discover 队列因 GitHub 限流暂停", {
		resumeAt: new Date(resumeAtMs).toISOString(),
		delayMs: delay,
	});
};

// resume job 的 processor：恢复队列 + 清 Redis key
export const processDiscoverResume = async (): Promise<void> => {
	const redis = getAppRedis();
	await discoverQueue.resume();
	await redis.del(DISCOVER_RESUME_AT_REDIS_KEY);
	console.warn("discover 队列已恢复（GitHub 限流窗口已过）");
};
