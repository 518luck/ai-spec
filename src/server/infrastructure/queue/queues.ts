import { Queue } from "bullmq";
import { getAppRedis } from "@/server/infrastructure/redis/clients";

import { BACKGROUND_JOBS_QUEUE_CONFIG } from "./constants";

// 后台任务队列实例（生产者），用应用侧 fail-fast 连接，避免 Redis 故障时挂住 HTTP 请求
export const backgroundJobsQueue = new Queue(BACKGROUND_JOBS_QUEUE_CONFIG.name, {
	connection: getAppRedis(),
	defaultJobOptions: BACKGROUND_JOBS_QUEUE_CONFIG.jobOptions,
});
