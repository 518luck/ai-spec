// 角色清单
export enum ROLE {
  GUEST = "guest", //游客，未登录用户
  USER = "user", //普通登录用户
  CREATOR = "creator", //内容创作者
  OWNER = "owner", //管理员
}

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
