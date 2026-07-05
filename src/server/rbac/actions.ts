// 统一的 Action 清单：API Key scope 与 Web 端 RBAC 的共同源

// 资源清单
const RESOURCE_KEYS = [
	// —— 内容资源 ——
	"promptRecord", // 提示词-收录
	"promptDraft", // 提示词-草稿
	"rules", // 规约库
	"agentMD", // AGENTS.md
	"skills", // Skills
	"agents", // 智能体
	"plugins", // Plugins
	// —— 团队专属概念 ——
	"project", // 团队项目
	"member", // 团队成员
	"team", // 团队设置
] as const;

// 合法 action 字面量联合，约束下方 action 字段
type ValidAction = `${(typeof RESOURCE_KEYS)[number]}.${"read" | "write"}`;

// 单条 action 的元信息定义
type ActionDef = {
	action: ValidAction;
	teamOnly: boolean; // 是否团队专属
	apiKeyGrantable: boolean; // API Key 能否授予
	description: string;
};

// 所有 action 的权威登记表
export const ACTION_DEFS = [
	// —— 内容资源（个人和团队空间都有，API Key 可授予）——
	{
		action: "promptRecord.read",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "浏览提示词-收录",
	},
	{
		action: "promptRecord.write",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "编辑提示词-收录",
	},
	{
		action: "promptDraft.read",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "浏览提示词-草稿",
	},
	{
		action: "promptDraft.write",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "编辑提示词-草稿",
	},
	{
		action: "rules.read",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "浏览规约库",
	},
	{
		action: "rules.write",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "编辑规约库",
	},
	{
		action: "agentMD.read",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "浏览 AGENTS.md",
	},
	{
		action: "agentMD.write",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "编辑 AGENTS.md",
	},
	{
		action: "skills.read",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "浏览 Skills",
	},
	{
		action: "skills.write",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "编辑 Skills",
	},
	{
		action: "agents.read",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "浏览智能体",
	},
	{
		action: "agents.write",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "编辑智能体",
	},
	{
		action: "plugins.read",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "浏览 Plugins",
	},
	{
		action: "plugins.write",
		teamOnly: false,
		apiKeyGrantable: true,
		description: "编辑 Plugins",
	},

	// —— 团队专属概念（API Key 不可授予）——
	{
		action: "project.read",
		teamOnly: true,
		apiKeyGrantable: false,
		description: "查看团队项目",
	},
	{
		action: "project.write",
		teamOnly: true,
		apiKeyGrantable: false,
		description: "管理团队项目",
	},
	{
		action: "member.read",
		teamOnly: true,
		apiKeyGrantable: false,
		description: "查看团队成员",
	},
	{
		action: "member.write",
		teamOnly: true,
		apiKeyGrantable: false,
		description: "邀请/移除成员、改角色",
	},
	{
		action: "team.read",
		teamOnly: true,
		apiKeyGrantable: false,
		description: "查看团队设置",
	},
	{
		action: "team.write",
		teamOnly: true,
		apiKeyGrantable: false,
		description: "修改团队设置",
	},
] as const satisfies readonly ActionDef[];

// 所有 action 字面量联合类型
export type Action = (typeof ACTION_DEFS)[number]["action"];

// API Key 可授予的 scope 子集
export const API_KEY_SCOPES: readonly Action[] = ACTION_DEFS.filter(
	(def) => def.apiKeyGrantable,
).map((def) => def.action);
