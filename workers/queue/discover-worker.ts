// # 请求队列 Worker：独立消费 discover 队列的 scan/sync-repo/sweep
// > 通过副作用 import 启动：被总入口 import 时自动创建实例并接线
// > 单并发串行（GitHub API 串行调用避免打爆配额）+ 撞限流时 pause，由 background-jobs 的 discover-resume 延迟 job 触发恢复

import { Worker } from "bullmq";
import { DISCOVER_SCAN_CRON, DISCOVER_SCAN_CRON_ENABLED } from "@/server/domain/discover/skills";
import { formatGithubMetrics } from "@/server/infrastructure/github/metrics";
import { DISCOVER_QUEUE_CONFIG, JOB_NAMES } from "@/server/infrastructure/queue/constants";
import { processDiscoverJob } from "@/server/infrastructure/queue/operations/discover";
import type { SyncRepoResult } from "@/server/infrastructure/queue/operations/discover/processors/discover-sync-repo";
import { discoverQueue } from "@/server/infrastructure/queue/queues";
import { getWorkerRedis } from "@/server/infrastructure/redis/clients";

// discover Worker：单并发串行消费，撞 GitHub 限流时整队列暂停，由延迟 job 触发恢复后按顺序继续
export const discoverWorker = new Worker(DISCOVER_QUEUE_CONFIG.name, processDiscoverJob, {
	connection: getWorkerRedis(),
	// 单并发：GitHub API 串行调用，避免并发打爆配额
	concurrency: 1,
});

// 每隔多少个 sync-repo 打印一次进度
const PROGRESS_LOG_INTERVAL = 5;

// sync-repo 进度计数器（一轮 scan 开始时重置）
let syncProgress = { total: 0, cached: 0, synced: 0, renamed: 0, failed: 0 };

// 格式化进度日志
const formatSyncProgress = (): string => {
	const { total, cached, synced, renamed, failed } = syncProgress;
	return `[sync-repo 进度] ${total} 个完成 | 缓存跳过: ${cached} | 全量同步: ${synced} | 改名合并: ${renamed} | 失败: ${failed}`;
};

discoverWorker.on("ready", () => {
	console.warn("Discover Worker 已启动，等待任务...");
});

discoverWorker.on("completed", (job, result) => {
	// sync-repo 任务：累计进度，每隔 N 个打印一次
	if (job.name === JOB_NAMES.discoverSyncRepo) {
		syncProgress.total += 1;
		const status = result as SyncRepoResult | undefined;
		if (status === "cached") syncProgress.cached += 1;
		else if (status === "synced") syncProgress.synced += 1;
		else if (status === "renamed") syncProgress.renamed += 1;

		if (syncProgress.total % PROGRESS_LOG_INTERVAL === 0) {
			console.warn(formatSyncProgress());
		}
		return;
	}

	console.warn("Discover 任务完成", { jobId: job.id, name: job.name });
	// > discover-scan 是同步流程的总指挥，它完成意味着一轮 awesome 源抓取结束，打印最终汇总
	if (job.name === JOB_NAMES.discoverScan) {
		// 打印剩余不足一轮间隔的 sync-repo 进度
		if (syncProgress.total % PROGRESS_LOG_INTERVAL !== 0) {
			console.warn(formatSyncProgress());
		}
		console.warn(formatGithubMetrics());
		// 重置计数器，为下一轮 scan 做准备
		syncProgress = { total: 0, cached: 0, synced: 0, renamed: 0, failed: 0 };
	}
});

discoverWorker.on("failed", (job, err) => {
	// sync-repo 失败：累计到进度计数器
	if (job?.name === JOB_NAMES.discoverSyncRepo) {
		syncProgress.total += 1;
		syncProgress.failed += 1;

		if (syncProgress.total % PROGRESS_LOG_INTERVAL === 0) {
			console.warn(formatSyncProgress());
		}
	}

	console.error("Discover 任务失败", {
		jobId: job?.id,
		name: job?.name,
		error: err.message,
		stack: err.stack,
	});
});

// > 注册广场扫描定时调度（cron 由 DISCOVER_SCAN_CRON 控制；默认 UTC 04:00；设 off 关闭）
// upsert 幂等：worker 重启不会重复注册；先清理 skill 域时期的旧调度 id，防止投递已无人认领的旧任务名
if (DISCOVER_SCAN_CRON_ENABLED) {
	discoverQueue
		.removeJobScheduler("skill-discover-daily")
		.then(() =>
			discoverQueue.upsertJobScheduler(
				"discover-scan-daily",
				{ pattern: DISCOVER_SCAN_CRON },
				{ name: JOB_NAMES.discoverScan, data: {} },
			),
		)
		.then(() => console.warn(`广场扫描调度已注册（cron: ${DISCOVER_SCAN_CRON}）`))
		.catch((err) =>
			console.error("注册广场扫描调度失败", {
				error: err instanceof Error ? err.message : String(err),
			}),
		);
} else {
	// 关闭定时时顺带卸掉已有调度，避免残留 repeatable 仍触发
	discoverQueue
		.removeJobScheduler("discover-scan-daily")
		.then(() => console.warn("广场扫描调度已关闭（DISCOVER_SCAN_CRON=off）"))
		.catch((err) =>
			console.error("移除广场扫描调度失败", {
				error: err instanceof Error ? err.message : String(err),
			}),
		);
}
