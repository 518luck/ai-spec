// 角色清单
// export enum ROLE {
//   GUEST = "guest", //游客，未登录用户
//   USER = "user", //普通登录用户
//   CREATOR = "creator", //内容创作者
//   OWNER = "owner", //管理员
// }
export type ROLE = "guest" | "user" | "creator" | "owner";

// 权限动作清单
export const PERMISSION_ACTIONS = [
  "prompt.read",
  "prompt.write",
  "agent.read",
  "agent.write",
  "tutorial.read",
  "tutorial.write",
  "folder.read",
  "folder.write",
  "testSession.read",
  "testSession.write",
  "user.read",
  "user.write",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
// "prompt", // 提示词
// "agent", // 智能体
// "tutorial", // 教程
// "folder", // 文件夹
// "testSession", // 测试会话
// "user", // 用户

export const ROLE_PERMISSIONS: {
  action: PermissionAction;
  description: string;
  roles: ROLE[];
}[] = [
  // 1. Prompt 相关的权限
  {
    action: "prompt.read",
    description: "浏览提示词",
    roles: ["guest", "user", "creator", "owner"],
  },
  {
    action: "prompt.write",
    description: "创建/编辑提示词",
    roles: ["user", "creator", "owner"],
  },

  // 2. Agent 相关的权限
  {
    action: "agent.read",
    description: "浏览智能体",
    roles: ["guest", "user", "creator", "owner"],
  },
  {
    action: "agent.write",
    description: "创建/编辑智能体",
    roles: ["user", "creator", "owner"],
  },

  // 3. 教程相关的权限
  {
    action: "tutorial.read",
    description: "浏览教程",
    roles: ["guest", "user", "creator", "owner"],
  },
  {
    action: "tutorial.write",
    description: "创建/编辑教程",
    roles: ["creator", "owner"],
  },

  // 4. 文件夹相关的权限
  {
    action: "folder.read",
    description: "浏览文件夹",
    roles: ["user", "creator", "owner"],
  },
  {
    action: "folder.write",
    description: "创建/编辑/删除文件夹",
    roles: ["user", "creator", "owner"],
  },

  // 5. 测试会话相关的权限
  {
    action: "testSession.read",
    description: "查看测试会话",
    roles: ["user", "creator", "owner"],
  },
  {
    action: "testSession.write",
    description: "创建测试会话",
    roles: ["user", "creator", "owner"],
  },

  // 6. 用户相关的权限
  {
    action: "user.read",
    description: "浏览用户信息",
    roles: ["guest", "user", "creator", "owner"],
  },
  {
    action: "user.write",
    description: "编辑用户信息",
    roles: ["user", "creator", "owner"],
  },
];
