// 角色清单（权限层级：guest < user < member）
// guest：游客，未登录用户
// user：用户，普通登录用户
// member：会员，拥有全部权限
export type ROLE = "guest" | "user" | "member";

// 权限动作清单（15 资源 × read/write 两个动作）
export const PERMISSION_ACTIONS = [
	// 个人内容资源
	"promptRecord.read", // 提示词-收录（已收录的提示词，可发布到发现区）
	"promptRecord.write",
	"promptDraft.read", // 提示词-草稿（仅自己可见）
	"promptDraft.write",
	"rules.read", // 规约库
	"rules.write",

	// 共享资源
	"agentMD.read", // AGENTS.md 文档
	"agentMD.write",
	"skills.read", // Skills
	"skills.write",
	"agents.read", // 智能体（Agents）
	"agents.write",
	"plugins.read", // Plugins
	"plugins.write",

	// 工作空间
	"project.read", // 项目
	"project.write",
	"member.read", // 成员（邀请、移除、改角色）
	"member.write",
	"team.read", // 团队/工作空间设置
	"team.write",
	"security.read", // 安全策略
	"security.write",
	"logs.read", // 操作日志
	"logs.write",

	// 设置
	"profile.read", // 个人详情
	"profile.write",
	"preference.read", // 个人偏好
	"preference.write",
	"secretKey.read", // API Key
	"secretKey.write",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const ROLE_PERMISSIONS: {
	action: PermissionAction;
	description: string;
	roles: ROLE[];
}[] = [
	// 1. 提示词-收录
	{
		action: "promptRecord.read",
		description: "浏览已收录的提示词",
		roles: ["guest", "user", "member"],
	},
	{
		action: "promptRecord.write",
		description: "新建/编辑/删除已收录的提示词",
		roles: ["user", "member"],
	},

	// 2. 提示词-草稿
	{
		action: "promptDraft.read",
		description: "查看自己的提示词草稿",
		roles: ["guest", "user", "member"],
	},
	{
		action: "promptDraft.write",
		description: "新建/编辑/删除提示词草稿",
		roles: ["user", "member"],
	},

	// 3. 规约库
	{
		action: "rules.read",
		description: "查看规约库",
		roles: ["guest", "user", "member"],
	},
	{
		action: "rules.write",
		description: "新建/编辑规约",
		roles: ["user", "member"],
	},

	// 4. AGENTS.md
	{
		action: "agentMD.read",
		description: "查看 AGENTS.md 文档",
		roles: ["guest", "user", "member"],
	},
	{
		action: "agentMD.write",
		description: "编辑 AGENTS.md 文档",
		roles: ["user", "member"],
	},

	// 5. Skills
	{
		action: "skills.read",
		description: "查看 Skills",
		roles: ["guest", "user", "member"],
	},
	{
		action: "skills.write",
		description: "新建/编辑/删除 Skills",
		roles: ["user", "member"],
	},

	// 6. 智能体
	{
		action: "agents.read",
		description: "查看智能体",
		roles: ["guest", "user", "member"],
	},
	{
		action: "agents.write",
		description: "新建/编辑/删除智能体",
		roles: ["user", "member"],
	},

	// 7. Plugins
	{
		action: "plugins.read",
		description: "查看 Plugins",
		roles: ["guest", "user", "member"],
	},
	{
		action: "plugins.write",
		description: "新建/编辑/删除 Plugins",
		roles: ["user", "member"],
	},

	// 8. 项目
	{
		action: "project.read",
		description: "查看团队项目",
		roles: ["member"],
	},
	{
		action: "project.write",
		description: "新建/编辑/管理团队项目",
		roles: ["member"],
	},

	// 9. 成员
	{
		action: "member.read",
		description: "查看团队成员列表",
		roles: ["member"],
	},
	{
		action: "member.write",
		description: "邀请/移除成员、改角色",
		roles: ["member"],
	},

	// 10. 团队
	{
		action: "team.read",
		description: "查看团队设置",
		roles: ["member"],
	},
	{
		action: "team.write",
		description: "修改团队设置",
		roles: ["member"],
	},

	// 11. 安全
	{
		action: "security.read",
		description: "查看团队安全策略",
		roles: ["member"],
	},
	{
		action: "security.write",
		description: "修改团队安全策略",
		roles: ["member"],
	},

	// 12. 日志
	{
		action: "logs.read",
		description: "查看团队操作日志",
		roles: ["member"],
	},
	{
		action: "logs.write",
		description: "清理/导出团队操作日志",
		roles: ["member"],
	},

	// 13. 个人详情
	{
		action: "profile.read",
		description: "查看个人资料",
		roles: ["guest", "user", "member"],
	},
	{
		action: "profile.write",
		description: "修改个人资料",
		roles: ["user", "member"],
	},

	// 14. 个人偏好
	{
		action: "preference.read",
		description: "查看个人偏好",
		roles: ["guest", "user", "member"],
	},
	{
		action: "preference.write",
		description: "修改个人偏好",
		roles: ["user", "member"],
	},

	// 15. API Key
	{
		action: "secretKey.read",
		description: "查看自己的 API Key",
		roles: ["guest", "user", "member"],
	},
	{
		action: "secretKey.write",
		description: "创建/删除/重置 API Key",
		roles: ["user", "member"],
	},
];
