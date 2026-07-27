// # 翻译 Provider 统一契约

// 批量翻译入参
export type TranslateTextsOptions = {
	texts: string[];
	// 源语言；不传默认按英文处理
	sourceLang?: "EN" | "ZH" | "auto";
	// 目标语言，默认简体中文
	targetLang?: "ZH";
};

// 批量翻译出参：与入参 texts 等长
export type TranslateTextsResult = {
	texts: string[];
};

// 翻译 provider：缺配置应直接抛错，禁止静默降级
export interface TranslationProvider {
	translateTexts: (options: TranslateTextsOptions) => Promise<TranslateTextsResult>;
}
