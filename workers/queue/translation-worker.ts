// # 翻译队列 Worker：独立消费 translation 队列的批量补译任务
// > 通过副作用 import 启动；并发由 TRANSLATION_CONCURRENCY 控制，不和邮件/GitHub 抢
// > 定时调度与 discover-scan 同模式：worker 启动时 upsertJobScheduler；pnpm translate 全量、test:translate 试跑

import { Worker } from "bullmq";
import { JOB_NAMES, TRANSLATION_QUEUE_CONFIG } from "@/server/infrastructure/queue/constants";
import {
	processTranslationJob,
	type TranslateBatchResult,
} from "@/server/infrastructure/queue/operations/translation";
import { translationQueue } from "@/server/infrastructure/queue/queues";
import { getWorkerRedis } from "@/server/infrastructure/redis/clients";
import {
	TRANSLATION_BATCH_CRON,
	TRANSLATION_BATCH_CRON_ENABLED,
	TRANSLATION_CONCURRENCY,
} from "@/server/infrastructure/translation/config";

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

// > 注册 skills 定时补译（cron 由 TRANSLATION_BATCH_CRON 控制；默认 UTC 05:00，晚于广场扫描）
// upsert 幂等：worker 重启不会重复注册；无 pending 时本批 scanned=0 直接结束
if (TRANSLATION_BATCH_CRON_ENABLED) {
	translationQueue
		.upsertJobScheduler(
			"translate-batch-skills-daily",
			{ pattern: TRANSLATION_BATCH_CRON },
			{
				name: JOB_NAMES.translateBatch,
				data: { resourceType: "skills", chain: true },
			},
		)
		.then(() => console.warn(`翻译补译调度已注册（cron: ${TRANSLATION_BATCH_CRON}）`))
		.catch((err) =>
			console.error("注册翻译补译调度失败", {
				error: err instanceof Error ? err.message : String(err),
			}),
		);
} else {
	// 关闭定时时顺带卸掉已有调度，避免残留 repeatable 仍触发
	translationQueue
		.removeJobScheduler("translate-batch-skills-daily")
		.then(() => console.warn("翻译补译调度已关闭（TRANSLATION_BATCH_CRON=off）"))
		.catch((err) =>
			console.error("移除翻译补译调度失败", {
				error: err instanceof Error ? err.message : String(err),
			}),
		);
}
