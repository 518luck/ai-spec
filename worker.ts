import "dotenv/config";
import "./worker-globals";

import { Worker } from "bullmq";
import {
	BACKGROUND_JOBS_QUEUE_CONFIG,
	JOB_NAMES,
} from "./src/server/infrastructure/queue/constants";
import { processBackgroundJob } from "./src/server/infrastructure/queue/operations/router";
import { backgroundJobsQueue } from "./src/server/infrastructure/queue/queues";
import { getWorkerRedis } from "./src/server/infrastructure/redis/clients";

// 注册后台任务 Worker，按 job.name 路由分发；消费侧用无限重试连接
const backgroundJobsWorker = new Worker(BACKGROUND_JOBS_QUEUE_CONFIG.name, processBackgroundJob, {
	connection: getWorkerRedis(),
});

backgroundJobsWorker.on("ready", () => {
	console.warn("后台任务 Worker 已启动，等待任务...");
});

// > 注册每日定时调度：凌晨 4 点投递一次广场扫描编排任务（upsert 幂等，worker 重启不会重复注册）
// 先幂等清理 skill 域时期的旧调度 id，防止它每天投递已无人认领的旧任务名
backgroundJobsQueue
	.removeJobScheduler("skill-discover-daily")
	.then(() =>
		backgroundJobsQueue.upsertJobScheduler(
			"discover-scan-daily",
			{ pattern: "0 4 * * *" },
			{ name: JOB_NAMES.discoverScan, data: {} },
		),
	)
	.then(() => console.warn("广场每日同步调度已注册（04:00）"))
	.catch((err) =>
		console.error("注册广场同步调度失败", {
			error: err instanceof Error ? err.message : String(err),
		}),
	);

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
