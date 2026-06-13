import { getBullMQRedis } from "@/shared/lib/infrastructure/redis/clients";
import { Queue } from "bullmq";
import { AVATAR_SYNC_QUEUE_CONFIG } from "./constants";

// 头像同步队列实例（生产者）
export const avatarSyncQueue = new Queue(AVATAR_SYNC_QUEUE_CONFIG.name, {
  connection: getBullMQRedis(),
  defaultJobOptions: AVATAR_SYNC_QUEUE_CONFIG.jobOptions,
});
