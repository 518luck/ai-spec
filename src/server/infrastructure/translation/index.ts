// # 翻译基础设施：腾讯 TMT 客户端 + 语言启发式（不含业务侧 getTranslationProvider）

// 队列批处理/cron 等翻译调度配置
export {
	TRANSLATION_AUTO_CHAIN,
	TRANSLATION_BATCH_CRON,
	TRANSLATION_BATCH_CRON_ENABLED,
	TRANSLATION_BATCH_LIMIT,
	TRANSLATION_CHUNK_SIZE,
	TRANSLATION_CONCURRENCY,
} from "./config";
// 语言启发式：原文指纹 / 是否已是中文 / 是否值得送译
export {
	hashDescription,
	isMostlyChinese,
	isWorthTranslating,
} from "./detect-language";
// 入库/变更时推导 textZh + translationStatus + hash（不调外部 API）
export { resolveTranslationFields } from "./resolve-translation-fields";
// 腾讯 provider 工厂（由 adapters/translation 做单例包装后给业务用）
export { createTencentProvider } from "./tencent-client";
// 翻译契约类型
export type {
	TranslateTextsOptions,
	TranslateTextsResult,
	TranslationProvider,
} from "./types";
