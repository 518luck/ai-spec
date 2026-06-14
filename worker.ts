import "dotenv/config";

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
  console.warn("头像同步 Worker 已启动，等待任务...");
});

avatarSyncWorker.on("completed", (job) => {
  console.warn("任务完成", { jobId: job.id });
});

avatarSyncWorker.on("failed", (job, err) => {
  console.error("任务失败", {
    jobId: job?.id,
    error: err.message,
    stack: err.stack,
  });
});

// 优雅退出：收到 SIGTERM/SIGINT 时关闭 Worker 连接
async function shutdown(): Promise<void> {
  console.warn("正在关闭...");
  try {
    await avatarSyncWorker.close();
  } catch (err) {
    console.error("关闭时出错", {
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    process.exit(0);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
