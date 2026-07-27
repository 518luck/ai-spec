// # 翻译基础设施：腾讯 TMT 客户端 + 语言启发式（不含业务侧 getTranslationProvider）

// 语言启发式：原文指纹 / 是否已是中文 / 是否值得送译
export {
	hashDescription,
	isMostlyChinese,
	isWorthTranslating,
} from "./detect-language";
// 腾讯 provider 工厂（由 adapters/translation 做单例包装后给业务用）
export { createTencentProvider } from "./tencent-client";
// 翻译契约类型
export type {
	TranslateTextsOptions,
	TranslateTextsResult,
	TranslationProvider,
} from "./types";
