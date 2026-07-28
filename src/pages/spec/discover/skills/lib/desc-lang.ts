// # Skills 描述语言：纯类型与解析（无 "use client"，SSR / 客户端均可 import）

// 卡片描述语言：中文优先展示 descriptionZh，英文展示原文 description
export type SkillDescLang = "zh" | "en";

// 从 cookie / 任意字符串解析语言；非法值回落中文
export const parseSkillDescLang = (value: string | undefined | null): SkillDescLang =>
	value === "en" ? "en" : "zh";
