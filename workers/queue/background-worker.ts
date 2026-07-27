// # 后台队列 Worker：消费 avatar/email/discover-resume 等通用任务
// > 通过副作用 import 启动：被总入口 import 时自动创建实例并接线
// > discover-resume 由 pauseDiscoverUntil 在撞限流时事件驱动投递，无需定时调度

import { Worker } from "bullmq";
import { BACKGROUND_JOBS_QUEUE_CONFIG } from "@/server/infrastructure/queue/constants";
import { processBackgroundJob } from "@/server/infrastructure/queue/operations/router";
import { getWorkerRedis } from "@/server/infrastructure/redis/clients";

// background-jobs Worker：消费 avatar/email/discover-resume 等通用任务（含 discover 限流恢复）
export const backgroundJobsWorker = new Worker(
	BACKGROUND_JOBS_QUEUE_CONFIG.name,
	processBackgroundJob,
	{
		connection: getWorkerRedis(),
	},
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
