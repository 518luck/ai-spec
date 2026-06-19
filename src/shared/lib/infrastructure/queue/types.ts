// 头像同步任务数据
export interface SyncOauthAvatarData {
  userId: string;
  imageUrl: string;
}

// 删除用户旧头像任务数据
export interface DeleteUserAvatarData {
  userId: string;
  avatarUrl: string;
}

// 邮箱变更验证邮件任务数据
export interface EmailChangeData {
  to: string;
  token: string;
  oldEmail: string;
  newEmail: string;
}

// 后台任务数据的联合类型，供 Worker 路由时类型收窄
export type BackgroundJobData =
  | SyncOauthAvatarData
  | DeleteUserAvatarData
  | EmailChangeData;
