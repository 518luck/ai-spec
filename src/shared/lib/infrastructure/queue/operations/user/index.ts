// 用户领域：processors（消费端）+ enqueues（生产端）的统一出口
export { processSyncOauthAvatar } from "./processors/sync-oauth-avatar";
export { processDeleteUserAvatar } from "./processors/delete-user-avatar";
export { enqueueAvatarSync } from "./enqueues/enqueue-avatar-sync";
export { enqueueDeleteUserAvatar } from "./enqueues/enqueue-delete-user-avatar";
