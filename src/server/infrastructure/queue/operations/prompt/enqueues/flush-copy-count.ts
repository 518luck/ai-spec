import { JOB_NAMES } from "../../../constants";
import { backgroundJobsQueue } from "../../../queues";
import type { FlushCopyCountData } from "../types";

// 落库延迟：5 分钟内同一 record 的多次复制合并为一次 UPDATE
const FLUSH_DELAY_MS = 5 * 60 * 1000;

// # 入队「落库 copy_count 增量」任务：jobId 按 recordId 去重，5 分钟窗口内同 record 只入队一次
export async function enqueueFlushCopyCount({ recordId }: FlushCopyCountData): Promise<void> {
	await backgroundJobsQueue.add(
		JOB_NAMES.flushCopyCount,
		{ recordId },
		{
			jobId: `flush-copy-count-${recordId}`,
			delay: FLUSH_DELAY_MS,
		},
	);
}
