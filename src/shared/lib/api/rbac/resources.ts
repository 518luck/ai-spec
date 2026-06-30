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

  // // 工作空间（团队当中也包含个人内容资源）
  // "project", // 项目
  // "member", // 成员
  // "team", // 团队/工作空间
  // "security", // 安全
  // "logs", //日志

  // // 设置
  // "profile", //个人详情
  // "preference", //个人偏好
  // "secretKey", // API Key
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
    description: "规整的常用提示词",
  },
  {
    key: "promptDraft",
    name: "提示词-草稿",
    description: "杂乱的提示词",
  },
  {
    key: "rules",
    name: "规约库",
    description: "通用的规则约定片段",
  },

  // —— 共享资源（个人空间与团队空间共有） ——
  {
    key: "agentMD",
    name: "AGENTS.md",
    description: "写给 AI 看的“岗位职责与工作守则",
  },
  {
    key: "skills",
    name: "Skills",
    description: "Skills 的查看、新建、编辑",
  },
  {
    key: "agents",
    name: "智能体",
    description: "能够自主规划并调用工具去完成复杂任务的 AI 助理",
  },
  {
    key: "plugins",
    name: "Plugins",
    description: "塞给 AI 的“工具箱”",
  },

  // // —— 工作空间 ——
  // {
  //   key: "project",
  //   name: "项目",
  //   description: "团队下项目的管理",
  // },
  // {
  //   key: "member",
  //   name: "成员",
  //   description: "团队成员的邀请、移除、改角色",
  // },
  // {
  //   key: "team",
  //   name: "团队",
  //   description: "团队/工作空间的设置与管理",
  // },
  // {
  //   key: "security",
  //   name: "安全",
  //   description: "团队安全策略的查看与修改",
  // },
  // {
  //   key: "logs",
  //   name: "日志",
  //   description: "团队操作日志的查看",
  // },

  // // —— 设置 ——
  // {
  //   key: "profile",
  //   name: "个人详情",
  //   description: "个人资料的查看与修改",
  // },
  // {
  //   key: "preference",
  //   name: "个人偏好",
  //   description: "个人偏好的查看与修改",
  // },
  // {
  //   key: "secretKey",
  //   name: "API Key",
  //   description: "个人 API Key 的查看、创建、删除、重置",
  // },
];
