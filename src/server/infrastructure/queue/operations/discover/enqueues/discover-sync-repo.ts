import { JOB_NAMES } from "../../../constants";
import { backgroundJobsQueue } from "../../../queues";
import type { DiscoverSyncRepoData } from "../types";

// # 入队单仓库同步任务（sha 比对后按需重抓，由发现任务批量 fan-out）
export async function enqueueDiscoverSyncRepo(data: DiscoverSyncRepoData): Promise<void> {
	await backgroundJobsQueue.add(JOB_NAMES.discoverSyncRepo, data);
}

// GitHub 限额按小时滚动，65 分钟后必然进入新窗口
const RATE_LIMIT_DEFER_MS = 65 * 60 * 1000;

// 限流场景的延迟重投：65 分钟后再试（不走 BullMQ 秒级退避，那撞不出限流窗口）
export async function enqueueDiscoverSyncRepoDeferred(data: DiscoverSyncRepoData): Promise<void> {
	await backgroundJobsQueue.add(JOB_NAMES.discoverSyncRepo, data, { delay: RATE_LIMIT_DEFER_MS });
}
