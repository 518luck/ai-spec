import {
	hashDescription,
	isMostlyChinese,
	isWorthTranslating,
} from "@/server/infrastructure/translation";
import type { TranslationStatus } from "@/shared/db/generator/client";

// # 广场文案翻译字段：入库时算状态，后台 job 批量补译（skills description，后续资源可复用）

type TranslationFields = {
	textZh: string | null;
	translationStatus: TranslationStatus;
	textHash: string;
};

// 按原文推导首次/变更后的翻译字段（不调用外部 API）
export const resolveTranslationFields = (text: string): TranslationFields => {
	const textHash = hashDescription(text);

	// 无实质文案：不送译
	if (!isWorthTranslating(text)) {
		return {
			textZh: null,
			translationStatus: "skipped",
			textHash,
		};
	}

	// 原文已是中文：回填 textZh，标记完成，避免浪费机翻额度
	if (isMostlyChinese(text)) {
		return {
			textZh: text,
			translationStatus: "done",
			textHash,
		};
	}

	// 英文等非中文：进入待译队列，由后台慢慢补
	return {
		textZh: null,
		translationStatus: "pending",
		textHash,
	};
};
