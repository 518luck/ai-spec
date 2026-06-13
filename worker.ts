import { Worker } from "bullmq";
import { AVATAR_SYNC_QUEUE_CONFIG } from "./src/shared/lib/infrastructure/queue/constants";
import { processSyncOauthAvatar } from "./src/shared/lib/infrastructure/queue/processors/sync-oauth-avatar";
import { getBullMQRedis } from "./src/shared/lib/infrastructure/redis/clients";

// 注册头像同步 Worker，从 Redis 队列取任务执行
const avatarSyncWorker = new Worker(
  AVATAR_SYNC_QUEUE_CONFIG.name,
  processSyncOauthAvatar,
  { connection: getBullMQRedis() },
);

avatarSyncWorker.on("ready", () => {
  console.log("[Worker] 头像同步 Worker 已启动，等待任务...");
});

avatarSyncWorker.on("completed", (job) => {
  console.log(`[Worker] 任务完成: ${job.id}`);
});

avatarSyncWorker.on("failed", (job, err) => {
  console.error(`[Worker] 任务失败: ${job?.id}`, err);
});

// 优雅退出：收到 SIGTERM/SIGINT 时关闭 Worker 连接
async function shutdown(): Promise<void> {
  console.log("[Worker] 正在关闭...");
  try {
    await avatarSyncWorker.close();
  } catch (err) {
    console.error("[Worker] 关闭时出错:", err);
  } finally {
    process.exit(0);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
