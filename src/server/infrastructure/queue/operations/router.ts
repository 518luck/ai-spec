import type { Job } from "bullmq";

import { JOB_NAMES } from "../constants";
import type { BackgroundJobData } from "../types";
import { processDiscoverResume } from "./discover";
import { processEmailChange, processEmailChangedNotice } from "./email";
import { processDeleteUserAvatar, processSyncOauthAvatar } from "./user";

// # 后台任务总路由：按 job.name 从注册表查处理器执行

// 任务处理器注册表：job.name → (data) => Promise<void>
// > 新增任务只需加一行；领域内 processor 在各自子目录维护，router 只做合并
// ! discover 的 scan/sync-repo/sweep 在独立 discover 队列；本队列只跑通用任务 + discover-resume（撞限流暂停后的恢复任务，必须跑在本队列才能在 discover 暂停时执行）
const JOB_REGISTRY = {
	[JOB_NAMES.avatarSync]: processSyncOauthAvatar,
	[JOB_NAMES.avatarCleanup]: processDeleteUserAvatar,
	[JOB_NAMES.emailChange]: processEmailChange,
	[JOB_NAMES.emailChangedNotice]: processEmailChangedNotice,
	[JOB_NAMES.discoverResume]: processDiscoverResume,
} as const;

// 后台任务总路由：按 job.name 从注册表查处理器执行，未知类型抛错
export async function processBackgroundJob(job: Job<BackgroundJobData>): Promise<void> {
	const processor = JOB_REGISTRY[job.name as keyof typeof JOB_REGISTRY];
	if (!processor) {
		throw new Error(`未知的后台任务类型: ${job.name}`);
	}
	// job.data 已是 BackgroundJobData 联合类型，processor 接收对应的具名分支
	await processor(job.data as never);
}
