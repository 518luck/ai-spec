// 用户领域：processors（消费端）+ enqueues（生产端）的统一出口
export { enqueueAvatarSync } from "./enqueues/avatar-sync";
export { enqueueDeleteUserAvatar } from "./enqueues/delete-user-avatar";
export { processDeleteUserAvatar } from "./processors/delete-user-avatar";
export { processSyncOauthAvatar } from "./processors/sync-oauth-avatar";
