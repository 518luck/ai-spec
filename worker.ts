import { Worker } from "bullmq";
import { AVATAR_SYNC_QUEUE_CONFIG } from "./src/shared/lib/infrastructure/queue/constants";
import { processSyncOauthAvatar } from "./src/shared/lib/infrastructure/queue/processors/sync-oauth-avatar";
import { getBullMQRedis } from "./src/shared/lib/infrastructure/redis/clients";
import { createLogger } from "./src/shared/lib/infrastructure/axiom/server";

// Worker 专用日志器，每条日志自动带 module: "avatar-sync-worker"
const log = createLogger("avatar-sync-worker");

// 注册头像同步 Worker，从 Redis 队列取任务执行
const avatarSyncWorker = new Worker(
  AVATAR_SYNC_QUEUE_CONFIG.name,
  processSyncOauthAvatar,
  { connection: getBullMQRedis() },
);

avatarSyncWorker.on("ready", () => {
  log.info("头像同步 Worker 已启动，等待任务...");
});

avatarSyncWorker.on("completed", (job) => {
  log.info("任务完成", { jobId: job.id });
});

avatarSyncWorker.on("failed", (job, err) => {
  log.error("任务失败", { jobId: job?.id, error: err.message, stack: err.stack });
});

// 优雅退出：收到 SIGTERM/SIGINT 时关闭 Worker 连接并刷新日志
async function shutdown(): Promise<void> {
  log.info("正在关闭...");
  try {
    await avatarSyncWorker.close();
  } catch (err) {
    log.error("关闭时出错", { error: err instanceof Error ? err.message : String(err) });
  } finally {
    await log.flush();
    process.exit(0);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
