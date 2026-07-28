import { getTranslationProvider } from "@/server/adapters/translation";
import {
	resolveTranslationFields,
	TRANSLATION_AUTO_CHAIN,
	TRANSLATION_BATCH_LIMIT,
	TRANSLATION_CHUNK_SIZE,
} from "@/server/infrastructure/translation";

import { enqueueTranslateBatch } from "../enqueues/translate-batch";
import { getTranslationTarget } from "../targets";
import type { TranslationLocalUpdate, TranslationPendingRow } from "../targets/types";
import type { TranslateBatchData } from "../types";

// # 处理器：按 resourceType 批量补译；块串行打 API，本批有余量则自动续跑

// 补译结果摘要，供 worker 日志打印
export type TranslateBatchResult = {
	resourceType: string;
	scanned: number;
	translated: number;
	localized: number;
	failed: number;
	chained: boolean;
};

// 把数组按 size 切块
const chunkArray = <T>(items: T[], size: number): T[][] => {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
};

// > 取待译 → 中文短路径本地消化 → 剩余按 chunk 调翻译适配层 → 可选自动续跑
export async function processTranslateBatch({
	resourceType,
	limit,
	chain = TRANSLATION_AUTO_CHAIN,
}: TranslateBatchData): Promise<TranslateBatchResult> {
	const target = getTranslationTarget(resourceType);
	if (!target) {
		throw new Error(`未注册的翻译资源类型: ${resourceType}`);
	}

	const batchLimit = Math.max(1, Math.min(limit ?? TRANSLATION_BATCH_LIMIT, 500));
	const rows = await target.fetchPending(batchLimit);

	if (rows.length === 0) {
		return {
			resourceType,
			scanned: 0,
			translated: 0,
			localized: 0,
			failed: 0,
			chained: false,
		};
	}

	// 先按启发式拆分：中文/极短本地收口，其余才进机翻
	const needApi: TranslationPendingRow[] = [];
	const localUpdates: TranslationLocalUpdate[] = [];

	for (const row of rows) {
		const fields = resolveTranslationFields(row.text);
		if (fields.translationStatus === "pending") {
			needApi.push(row);
			continue;
		}
		if (fields.translationStatus === "done" || fields.translationStatus === "skipped") {
			localUpdates.push({
				id: row.id,
				textZh: fields.textZh,
				status: fields.translationStatus,
				textHash: fields.textHash,
			});
		}
	}

	await target.applyLocal(localUpdates);

	if (needApi.length === 0) {
		const chained = await maybeChainNext({ resourceType, chain, limit: batchLimit });
		return {
			resourceType,
			scanned: rows.length,
			translated: 0,
			localized: localUpdates.length,
			failed: 0,
			chained,
		};
	}

	// 缺密钥等配置错误会在此处直接抛出，worker 记 failed，避免静默不翻
	const provider = getTranslationProvider();

	const chunks = chunkArray(needApi, TRANSLATION_CHUNK_SIZE);
	const translatedItems: Array<{ id: string; text: string; textZh: string }> = [];
	const failedIds: string[] = [];

	// 块与块串行：腾讯 TextTranslate 约 5 次/秒；块内并发由 provider 控制
	for (const chunk of chunks) {
		try {
			const { texts } = await provider.translateTexts({
				texts: chunk.map((row) => row.text),
				sourceLang: "EN",
				targetLang: "ZH",
			});
			translatedItems.push(
				...chunk.map((row, index) => ({
					id: row.id,
					text: row.text,
					textZh: texts[index] ?? row.text,
				})),
			);
		} catch (error) {
			failedIds.push(...chunk.map((row) => row.id));
			console.error("translate-batch chunk 失败", {
				resourceType,
				chunkSize: chunk.length,
				error: error instanceof Error ? error.message : String(error),
			});
			// 配置类错误（缺密钥等）整批无意义，直接抛给 worker 暴露问题
			if (error instanceof Error && error.message.includes("TENCENT_SECRET")) {
				await target.markFailed(failedIds);
				throw error;
			}
		}
	}

	await target.applyTranslated(translatedItems);
	await target.markFailed(failedIds);

	// 有进展才续跑，避免整批 API 失败时死循环空转
	const madeProgress = translatedItems.length > 0 || localUpdates.length > 0;
	const chained = madeProgress
		? await maybeChainNext({ resourceType, chain, limit: batchLimit })
		: false;

	return {
		resourceType,
		scanned: rows.length,
		translated: translatedItems.length,
		localized: localUpdates.length,
		failed: failedIds.length,
		chained,
	};
}

type MaybeChainNextOptions = {
	resourceType: TranslateBatchData["resourceType"];
	chain: boolean;
	limit: number;
};

// 本批成功且仍有待译时，再投下一 intern
const maybeChainNext = async ({
	resourceType,
	chain,
	limit,
}: MaybeChainNextOptions): Promise<boolean> => {
	if (!chain) {
		return false;
	}
	const target = getTranslationTarget(resourceType);
	if (!target) {
		return false;
	}
	const hasMore = await target.hasMorePending();
	if (!hasMore) {
		return false;
	}
	await enqueueTranslateBatch({ resourceType, limit, chain: true });
	return true;
};
