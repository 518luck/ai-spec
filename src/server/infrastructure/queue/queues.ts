import { Queue } from "bullmq";
import { getAppRedis } from "@/server/infrastructure/redis/clients";

import {
	BACKGROUND_JOBS_QUEUE_CONFIG,
	DISCOVER_QUEUE_CONFIG,
	TRANSLATION_QUEUE_CONFIG,
} from "./constants";

// # 后台任务队列实例（生产者）

// 后台任务队列实例（生产者），用应用侧 fail-fast 连接，避免 Redis 故障时挂住 HTTP 请求
export const backgroundJobsQueue = new Queue(BACKGROUND_JOBS_QUEUE_CONFIG.name, {
	connection: getAppRedis(),
	defaultJobOptions: BACKGROUND_JOBS_QUEUE_CONFIG.jobOptions,
});

// > discover 队列实例（生产者）：scan/sync-repo/sweep 投这里，受配额守卫统一 pause/resume
export const discoverQueue = new Queue(DISCOVER_QUEUE_CONFIG.name, {
	connection: getAppRedis(),
	defaultJobOptions: DISCOVER_QUEUE_CONFIG.jobOptions,
});

// > translation 队列实例（生产者）：机翻补译投这里，可独立提高 concurrency
export const translationQueue = new Queue(TRANSLATION_QUEUE_CONFIG.name, {
	connection: getAppRedis(),
	defaultJobOptions: TRANSLATION_QUEUE_CONFIG.jobOptions,
});
