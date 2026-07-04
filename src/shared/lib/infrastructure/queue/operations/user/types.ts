// 用户领域任务数据类型
export interface SyncOauthAvatarData {
  userId: string;
  imageUrl: string;
}

export interface DeleteUserAvatarData {
  userId: string;
  avatarUrl: string;
}
