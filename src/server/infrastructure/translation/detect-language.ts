import { createHash } from "node:crypto";

// # 描述语言启发式：判断是否已是中文、是否值得送译，并生成原文指纹

// 去空白后长度低于此值视为无实质文案，直接跳过翻译
const MIN_TRANSLATABLE_LENGTH = 2;

// 汉字占可计数字符的比例达到此阈值，视为「已是中文」不送机翻
const CHINESE_RATIO_THRESHOLD = 0.3;

// 计算 description 指纹：原文未变则跳过重译
export const hashDescription = (description: string): string =>
	createHash("sha256").update(description).digest("hex");

// 粗判文本是否以中文为主（含中英混排里汉字足够多的情况）
export const isMostlyChinese = (text: string): boolean => {
	const compact = text.replace(/\s+/g, "");
	if (!compact) {
		return false;
	}

	// 只统计字母数字与汉字，忽略标点，避免标点稀释占比
	const countable = compact.match(/[\p{L}\p{N}\p{Script=Han}]/gu) ?? [];
	if (countable.length === 0) {
		return false;
	}

	const cjkCount = countable.filter((ch) => /\p{Script=Han}/u.test(ch)).length;
	return cjkCount / countable.length >= CHINESE_RATIO_THRESHOLD;
};

// 是否值得送翻译 API（空、极短、纯符号 → 否）
export const isWorthTranslating = (text: string): boolean => {
	const compact = text.replace(/\s+/g, "");
	if (compact.length < MIN_TRANSLATABLE_LENGTH) {
		return false;
	}
	// 至少含一个字母或汉字
	return /[\p{L}\p{Script=Han}]/u.test(compact);
};
