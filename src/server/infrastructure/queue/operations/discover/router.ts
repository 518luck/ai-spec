import type { Job } from "bullmq";

import { JOB_NAMES } from "../../constants";
import { processDiscoverScan } from "./processors/discover-scan";
import { processDiscoverSweep } from "./processors/discover-sweep";
import { processDiscoverSyncRepo } from "./processors/discover-sync-repo";
import type { DiscoverScanData, DiscoverSweepData, DiscoverSyncRepoData } from "./types";

// # discover 队列路由：独立于 background-jobs，scan/sync-repo/sweep 从这里分发
// > discover-resume 投在 background-jobs 队列（撞限流暂停 discover 后，resume 必须能在 discover 暂停时执行），其 processor 由 background router 注册

// discover 任务数据联合类型（不含 discover-resume，它在另一个队列）
export type DiscoverJobData = DiscoverScanData | DiscoverSyncRepoData | DiscoverSweepData;

// 任务处理器注册表：job.name → (data) => Promise<结果>
// > 大部分处理器无返回值；sync-repo 返回状态字符串供 worker 打印进度
const DISCOVER_JOB_REGISTRY = {
	[JOB_NAMES.discoverScan]: processDiscoverScan,
	[JOB_NAMES.discoverSyncRepo]: processDiscoverSyncRepo,
	[JOB_NAMES.discoverSweep]: processDiscoverSweep,
} as const;

// discover 队列路由：按 job.name 从注册表查处理器执行，透传返回值，未知类型抛错
export async function processDiscoverJob(job: Job<DiscoverJobData>): Promise<string | undefined> {
	const processor = DISCOVER_JOB_REGISTRY[job.name as keyof typeof DISCOVER_JOB_REGISTRY];
	if (!processor) {
		throw new Error(`未知的 discover 任务类型: ${job.name}`);
	}
	return (await processor(job.data as never)) as string | undefined;
}
