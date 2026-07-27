import type { Job } from "bullmq";

import { JOB_NAMES } from "../../constants";
import { processTranslateBatch } from "./processors/translate-batch";
import type { TranslateBatchData } from "./types";

// # translation 队列路由：按 job.name 分发到对应处理器

// translation 任务数据联合类型（后续可加 translate-one 等）
export type TranslationJobData = TranslateBatchData;

// 任务处理器注册表
const TRANSLATION_JOB_REGISTRY = {
	[JOB_NAMES.translateBatch]: processTranslateBatch,
} as const;

// translation 队列路由：未知类型抛错；透传处理器返回值供 worker 打日志
export async function processTranslationJob(job: Job<TranslationJobData>): Promise<unknown> {
	const processor = TRANSLATION_JOB_REGISTRY[job.name as keyof typeof TRANSLATION_JOB_REGISTRY];
	if (!processor) {
		throw new Error(`未知的 translation 任务类型: ${job.name}`);
	}
	return processor(job.data as never);
}
