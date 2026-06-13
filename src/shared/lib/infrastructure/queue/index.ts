import { AVATAR_SYNC_QUEUE_CONFIG } from "./constants";
import { avatarSyncQueue } from "./queues";
import type { SyncOauthAvatarData } from "./types";

// 入队头像同步任务
export async function enqueueAvatarSync(
  data: SyncOauthAvatarData,
): Promise<void> {
  await avatarSyncQueue.add(AVATAR_SYNC_QUEUE_CONFIG.name, data);
}
