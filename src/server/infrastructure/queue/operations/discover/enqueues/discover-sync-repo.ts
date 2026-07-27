import { JOB_NAMES } from "../../../constants";
import { discoverQueue } from "../../../queues";
import type { DiscoverSyncRepoData } from "../types";

// # 入队单仓库同步任务（sha 比对后按需重抓，由发现任务批量 fan-out）
export async function enqueueDiscoverSyncRepo(data: DiscoverSyncRepoData): Promise<void> {
	await discoverQueue.add(JOB_NAMES.discoverSyncRepo, data);
}
