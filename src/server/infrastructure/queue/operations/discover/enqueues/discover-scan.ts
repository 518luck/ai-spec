import { JOB_NAMES } from "../../../constants";
import { discoverQueue } from "../../../queues";
import type { DiscoverScanData } from "../types";

// # 入队广场扫描任务（刷新 awesome 货源 → fan-out 仓库同步 → 收尾 sweep）
// > 不传 source 跑全部源（cron 用），传 source 只跑指定源（测试用）
export async function enqueueDiscoverScan(data: DiscoverScanData = {}): Promise<void> {
	await discoverQueue.add(JOB_NAMES.discoverScan, data);
}
