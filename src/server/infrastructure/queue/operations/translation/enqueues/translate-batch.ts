import { JOB_NAMES } from "../../../constants";
import { translationQueue } from "../../../queues";
import type { TranslateBatchData } from "../types";

// # 入队批量补译任务（投 translation 独立队列）
export async function enqueueTranslateBatch(data: TranslateBatchData): Promise<void> {
	await translationQueue.add(JOB_NAMES.translateBatch, data);
}
