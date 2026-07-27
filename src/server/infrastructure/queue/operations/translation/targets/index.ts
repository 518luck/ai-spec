import type { TranslationResourceType } from "../types";
import { skillsTranslationTarget } from "./skills";
import type { TranslationTarget } from "./types";

// # 翻译 target 注册表：加 plugins/mcp 等资源时在此登记一行

const TRANSLATION_TARGETS = {
	skills: skillsTranslationTarget,
} as const satisfies Record<TranslationResourceType, TranslationTarget>;

// 按资源类型取 target；未注册则返回 null
export const getTranslationTarget = (
	resourceType: TranslationResourceType,
): TranslationTarget | null => TRANSLATION_TARGETS[resourceType] ?? null;

export type { TranslationTarget } from "./types";
