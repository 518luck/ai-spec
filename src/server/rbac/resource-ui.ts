// # 资源 UI 元信息：从 actions.ts 派生资源 key 类型与清单，补充中文名等展示信息
import { ACTION_DEFS } from "./actions";

// @ 资源类型派生：从 action 字面量（如 "promptDraft.read"）提取资源 key

// 所有资源 key 的字面量联合，从 actions.ts 派生
export type ResourceKey = (typeof ACTION_DEFS)[number]["action"] extends `${infer R}.${string}`
	? R
	: never;

// 资源 key 列表（去重），供遍历初始化矩阵等场景使用
export const RESOURCE_KEYS = [
	...new Set(ACTION_DEFS.map((def) => def.action.split(".")[0])),
] as readonly ResourceKey[];

// @ 可归入文件夹的内容资源子集（排除 project/member/team 等团队管理概念）
export const FOLDERABLE_RESOURCE_KEYS = [
	"promptRecord",
	"promptDraft",
	"rules",
	"agentMD",
	"skills",
	"agents",
	"plugins",
] as const satisfies readonly ResourceKey[];

// @ 可打标签的内容资源子集；当前只有收录（PromptRecordTag 关联表已建），将来扩展在此追加
export const TAGGABLE_RESOURCE_KEYS = ["promptRecord"] as const satisfies readonly ResourceKey[];

// @ 资源中文展示信息：供 API Key 弹窗渲染，团队专属资源不在此列
export const RESOURCES = [
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
