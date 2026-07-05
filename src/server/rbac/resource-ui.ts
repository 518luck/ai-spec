// 资源 UI 元信息：资源 key 类型与清单从 actions.ts 派生，
// 此处只补充中文名与描述等面向用户的展示信息。
import { ACTION_DEFS } from "./actions";

// 所有资源 key 的字面量联合，从 actions.ts 派生
export type ResourceKey = (typeof ACTION_DEFS)[number]["action"] extends `${infer R}.${string}`
	? R
	: never;

// 资源 key 列表（去重），供遍历初始化矩阵等场景使用
export const RESOURCE_KEYS = [
	...new Set(ACTION_DEFS.map((def) => def.action.split(".")[0])),
] as readonly ResourceKey[];

// 资源 UI 元信息：中文名与描述，供 API Key 弹窗等界面渲染
// 团队专属资源不出现在此（API Key 弹窗不显示团队资源）
export const RESOURCES = [
	// —— 个人内容资源 ——
	{
		key: "promptRecord",
		name: "提示词-收录",
		description: "已收录的常用提示词",
	},
	{
		key: "promptDraft",
		name: "提示词-草稿",
		description: "未整理的提示词草稿",
	},
	{
		key: "rules",
		name: "规约库",
		description: "可复用的规则约定片段",
	},

	// —— 共享资源（个人空间与团队空间共有） ——
	{
		key: "agentMD",
		name: "AGENTS.md",
		description: "指导 AI 行为的项目规约文档",
	},
	{
		key: "skills",
		name: "Skills",
		description: "可复用的 AI 能力模块",
	},
	{
		key: "agents",
		name: "智能体",
		description: "自主调用工具完成任务的 AI 助理",
	},
	{
		key: "plugins",
		name: "Plugins",
		description: "供 AI 调用的外部工具集",
	},
] as const satisfies readonly {
	key: ResourceKey;
	name: string;
	description: string;
}[];
