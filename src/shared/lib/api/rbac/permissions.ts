// 角色清单
// export enum ROLE {
//   GUEST = "guest", //游客，未登录用户
//   MEMBER = "member", //普通登录用户
//   ADMIN = "admin", //管理员
//   OWNER = "owner", //超级管理员
// }
export type ROLE = "guest" | "member" | "admin" | "owner";

// 权限动作清单（16 资源 × read/write 两个动作）
export const PERMISSION_ACTIONS = [
  // 个人内容资源
  "promptRecord.read",
  "promptRecord.write",
  "promptDraft.read",
  "promptDraft.write",
  "rules.read",
  "rules.write",

  // 共享资源
  "agentMD.read",
  "agentMD.write",
  "skills.read",
  "skills.write",
  "agents.read",
  "agents.write",
  "plugins.read",
  "plugins.write",

  // 工作空间
  "project.read",
  "project.write",
  "member.read",
  "member.write",
  "team.read",
  "team.write",
  "security.read",
  "security.write",
  "logs.read",
  "logs.write",

  // 设置
  "profile.read",
  "profile.write",
  "preference.read",
  "preference.write",
  "secretKey.read",
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
    roles: ["guest", "member", "admin", "owner"],
  },
  {
    action: "promptRecord.write",
    description: "新建/编辑/删除已收录的提示词",
    roles: ["member", "admin", "owner"],
  },

  // 2. 提示词-草稿
  {
    action: "promptDraft.read",
    description: "查看自己的提示词草稿",
    roles: ["member", "admin", "owner"],
  },
  {
    action: "promptDraft.write",
    description: "新建/编辑/删除提示词草稿",
    roles: ["member", "admin", "owner"],
  },

  // 3. 规约库
  {
    action: "rules.read",
    description: "查看规约库",
    roles: ["member", "admin", "owner"],
  },
  {
    action: "rules.write",
    description: "新建/编辑规约",
    roles: ["member", "admin", "owner"],
  },

  // 4. AGENTS.md
  {
    action: "agentMD.read",
    description: "查看 AGENTS.md 文档",
    roles: ["guest", "member", "admin", "owner"],
  },
  {
    action: "agentMD.write",
    description: "编辑 AGENTS.md 文档",
    roles: ["member", "admin", "owner"],
  },

  // 5. Skills
  {
    action: "skills.read",
    description: "查看 Skills",
    roles: ["guest", "member", "admin", "owner"],
  },
  {
    action: "skills.write",
    description: "新建/编辑/删除 Skills",
    roles: ["member", "admin", "owner"],
  },

  // 6. 智能体
  {
    action: "agents.read",
    description: "查看智能体",
    roles: ["guest", "member", "admin", "owner"],
  },
  {
    action: "agents.write",
    description: "新建/编辑/删除智能体",
    roles: ["member", "admin", "owner"],
  },

  // 7. Plugins
  {
    action: "plugins.read",
    description: "查看 Plugins",
    roles: ["guest", "member", "admin", "owner"],
  },
  {
    action: "plugins.write",
    description: "新建/编辑/删除 Plugins",
    roles: ["member", "admin", "owner"],
  },

  // 8. 项目
  {
    action: "project.read",
    description: "查看团队项目",
    roles: ["admin", "owner"],
  },
  {
    action: "project.write",
    description: "新建/编辑/管理团队项目",
    roles: ["admin", "owner"],
  },

  // 9. 成员
  {
    action: "member.read",
    description: "查看团队成员列表",
    roles: ["admin", "owner"],
  },
  {
    action: "member.write",
    description: "邀请/移除成员、改角色",
    roles: ["admin", "owner"],
  },

  // 10. 团队
  {
    action: "team.read",
    description: "查看团队设置",
    roles: ["admin", "owner"],
  },
  {
    action: "team.write",
    description: "修改团队设置",
    roles: ["admin", "owner"],
  },

  // 11. 安全
  {
    action: "security.read",
    description: "查看团队安全策略",
    roles: ["admin", "owner"],
  },
  {
    action: "security.write",
    description: "修改团队安全策略",
    roles: ["admin", "owner"],
  },

  // 12. 日志
  {
    action: "logs.read",
    description: "查看团队操作日志",
    roles: ["admin", "owner"],
  },
  {
    action: "logs.write",
    description: "清理/导出团队操作日志",
    roles: ["admin", "owner"],
  },

  // 13. 个人详情
  {
    action: "profile.read",
    description: "查看个人资料",
    roles: ["guest", "member", "admin", "owner"],
  },
  {
    action: "profile.write",
    description: "修改个人资料",
    roles: ["member", "admin", "owner"],
  },

  // 14. 个人偏好
  {
    action: "preference.read",
    description: "查看个人偏好",
    roles: ["member", "admin", "owner"],
  },
  {
    action: "preference.write",
    description: "修改个人偏好",
    roles: ["member", "admin", "owner"],
  },

  // 15. API Key
  {
    action: "secretKey.read",
    description: "查看自己的 API Key",
    roles: ["member", "admin", "owner"],
  },
  {
    action: "secretKey.write",
    description: "创建/删除/重置 API Key",
    roles: ["member", "admin", "owner"],
  },
];
