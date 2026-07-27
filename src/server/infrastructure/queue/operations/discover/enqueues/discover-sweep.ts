import { JOB_NAMES } from "../../../constants";
import { discoverQueue } from "../../../queues";

// # 入队 sweep 收尾任务（标记久未在上游出现的条目下架）
export async function enqueueDiscoverSweep(): Promise<void> {
	await discoverQueue.add(JOB_NAMES.discoverSweep, {});
}
