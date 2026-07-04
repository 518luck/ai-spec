// 资源
export const RESOURCE_KEYS = [
	// 个人内容资源
	"promptRecord", // 提示词-收录
	"promptDraft", // 提示词-草稿
	"rules", // 规约库
	// （共享）
	"agentMD", // AGENTS.md（文档）
	"skills", // Skills
	"agents", // 智能体（Agents）
	"plugins", // Plugins
] as const;

export type ResourceKey = (typeof RESOURCE_KEYS)[number];

// 元信息
export const RESOURCES: {
	name: string;
	key: ResourceKey;
	description: string;
}[] = [
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
];
