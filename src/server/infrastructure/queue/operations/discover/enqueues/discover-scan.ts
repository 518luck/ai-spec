import { JOB_NAMES } from "../../../constants";
import { backgroundJobsQueue } from "../../../queues";

// # 入队广场扫描任务（刷新 awesome 货源 → fan-out 仓库同步 → 收尾 sweep）
export async function enqueueDiscoverScan(): Promise<void> {
	await backgroundJobsQueue.add(JOB_NAMES.discoverScan, {});
}
