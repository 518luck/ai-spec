import "dotenv/config";

//TODO :后面这个需要独立创建一个项目,变成一个独立的服务，专门负责处理队列任务，不能和 Next.js 混在一起，否则会有很多不必要的依赖和性能问题

import { Worker } from "bullmq";
import { BACKGROUND_JOBS_QUEUE_CONFIG } from "./src/shared/lib/infrastructure/queue/constants";
import { processBackgroundJob } from "./src/shared/lib/infrastructure/queue/operations/router";
import { getWorkerRedis } from "./src/shared/lib/infrastructure/redis/clients";

// 注册后台任务 Worker，按 job.name 路由分发；消费侧用无限重试连接
const backgroundJobsWorker = new Worker(
  BACKGROUND_JOBS_QUEUE_CONFIG.name,
  processBackgroundJob,
  { connection: getWorkerRedis() },
);

backgroundJobsWorker.on("ready", () => {
  console.warn("后台任务 Worker 已启动，等待任务...");
});

backgroundJobsWorker.on("completed", (job) => {
  console.warn("任务完成", { jobId: job.id, name: job.name });
});

backgroundJobsWorker.on("failed", (job, err) => {
  console.error("任务失败", {
    jobId: job?.id,
    name: job?.name,
    error: err.message,
    stack: err.stack,
  });
});

// 优雅退出：收到 SIGTERM/SIGINT 时关闭 Worker 连接
async function shutdown(): Promise<void> {
  console.warn("正在关闭...");
  try {
    await backgroundJobsWorker.close();
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
