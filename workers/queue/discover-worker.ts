// # 请求队列 Worker：独立消费 discover 队列的 scan/sync-repo/sweep
// > 通过副作用 import 启动：被总入口 import 时自动创建实例并接线
// > 单并发串行（GitHub API 串行调用避免打爆配额）+ 撞限流时 pause，由 background-jobs 的 discover-resume 延迟 job 触发恢复

import { Worker } from "bullmq";
import { formatGithubMetrics } from "@/server/infrastructure/github/metrics";
import { DISCOVER_QUEUE_CONFIG, JOB_NAMES } from "@/server/infrastructure/queue/constants";
import { processDiscoverJob } from "@/server/infrastructure/queue/operations/discover";
import { discoverQueue } from "@/server/infrastructure/queue/queues";
import { getWorkerRedis } from "@/server/infrastructure/redis/clients";

// discover Worker：单并发串行消费，撞 GitHub 限流时整队列暂停，由延迟 job 触发恢复后按顺序继续
export const discoverWorker = new Worker(DISCOVER_QUEUE_CONFIG.name, processDiscoverJob, {
	connection: getWorkerRedis(),
	// 单并发：GitHub API 串行调用，避免并发打爆配额
	concurrency: 1,
});

discoverWorker.on("ready", () => {
	console.warn("Discover Worker 已启动，等待任务...");
});

discoverWorker.on("completed", (job) => {
	console.warn("Discover 任务完成", { jobId: job.id, name: job.name });
	// > discover-scan 是同步流程的总指挥，它完成意味着一轮 awesome 源抓取结束，打印 GitHub API 消耗汇总
	if (job.name === JOB_NAMES.discoverScan) {
		console.warn(formatGithubMetrics());
	}
});

discoverWorker.on("failed", (job, err) => {
	console.error("Discover 任务失败", {
		jobId: job?.id,
		name: job?.name,
		error: err.message,
		stack: err.stack,
	});
});

// > 注册每日定时调度：凌晨 4 点投递一次广场扫描编排任务到 discover 队列（upsert 幂等，worker 重启不会重复注册）
// 先幂等清理 skill 域时期的旧调度 id，防止它每天投递已无人认领的旧任务名
discoverQueue
	.removeJobScheduler("skill-discover-daily")
	.then(() =>
		discoverQueue.upsertJobScheduler(
			"discover-scan-daily",
			{ pattern: "0 4 * * *" },
			{ name: JOB_NAMES.discoverScan, data: {} },
		),
	)
	.then(() => console.warn("广场每日同步调度已注册（04:00）"))
	.catch((err) =>
		console.error("注册广场同步调度失败", {
			error: err instanceof Error ? err.message : String(err),
		}),
	);
