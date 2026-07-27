// # 翻译队列 Worker：独立消费 translation 队列的批量补译任务
// > 通过副作用 import 启动；并发由 TRANSLATION_CONCURRENCY 控制，不和邮件/GitHub 抢

import { Worker } from "bullmq";
import { TRANSLATION_CONCURRENCY } from "@/server/configs/translation.config";
import { JOB_NAMES, TRANSLATION_QUEUE_CONFIG } from "@/server/infrastructure/queue/constants";
import {
	processTranslationJob,
	type TranslateBatchResult,
} from "@/server/infrastructure/queue/operations/translation";
import { getWorkerRedis } from "@/server/infrastructure/redis/clients";

// translation Worker：可独立 concurrency，与 background / discover 隔离
export const translationWorker = new Worker(TRANSLATION_QUEUE_CONFIG.name, processTranslationJob, {
	connection: getWorkerRedis(),
	concurrency: TRANSLATION_CONCURRENCY,
});

translationWorker.on("ready", () => {
	console.warn(`Translation Worker 已启动（concurrency=${TRANSLATION_CONCURRENCY}），等待任务...`);
});

translationWorker.on("completed", (job, result) => {
	if (job.name === JOB_NAMES.translateBatch) {
		const summary = result as TranslateBatchResult | undefined;
		if (summary) {
			console.warn("翻译批次完成", {
				jobId: job.id,
				resourceType: summary.resourceType,
				scanned: summary.scanned,
				translated: summary.translated,
				localized: summary.localized,
				failed: summary.failed,
				chained: summary.chained,
			});
			return;
		}
	}
	console.warn("Translation 任务完成", { jobId: job.id, name: job.name });
});

translationWorker.on("failed", (job, err) => {
	console.error("Translation 任务失败", {
		jobId: job?.id,
		name: job?.name,
		error: err.message,
		stack: err.stack,
	});
});
