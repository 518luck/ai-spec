// # 翻译 target 契约：每种资源实现一套「取待译 / 写回 / 计数」

// 待译行：业务主键 + 待译原文
export type TranslationPendingRow = {
	id: string;
	text: string;
};

// 本地短路径写回（原文已是中文 / 极短跳过）
export type TranslationLocalUpdate = {
	id: string;
	textZh: string | null;
	status: "done" | "skipped";
	textHash: string;
};

// 机翻成功写回
export type TranslationTranslatedUpdate = {
	id: string;
	text: string;
	textZh: string;
};

// 一种资源的翻译 target
export type TranslationTarget = {
	resourceType: string;
	// 拉取高优先级待译行
	fetchPending: (limit: number) => Promise<TranslationPendingRow[]>;
	// 本地短路径批量写回
	applyLocal: (items: TranslationLocalUpdate[]) => Promise<void>;
	// 机翻结果批量写回
	applyTranslated: (items: TranslationTranslatedUpdate[]) => Promise<void>;
	// 整批 API 失败时标记
	markFailed: (ids: string[]) => Promise<void>;
	// 是否还有待译（用于自动续跑）
	hasMorePending: () => Promise<boolean>;
};
