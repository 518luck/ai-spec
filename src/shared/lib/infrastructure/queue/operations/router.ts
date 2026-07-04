import type { Job } from "bullmq";

import { JOB_NAMES } from "../constants";
import type { BackgroundJobData } from "../types";
import { processEmailChange, processEmailChangedNotice } from "./email";
import { processDeleteUserAvatar, processSyncOauthAvatar } from "./user";

// 任务处理器注册表：job.name → (data) => Promise<void>
// 新增任务只需加一行；领域内 processor 在各自子目录维护，router 只做合并
const JOB_REGISTRY = {
	[JOB_NAMES.avatarSync]: processSyncOauthAvatar,
	[JOB_NAMES.avatarCleanup]: processDeleteUserAvatar,
	[JOB_NAMES.emailChange]: processEmailChange,
	[JOB_NAMES.emailChangedNotice]: processEmailChangedNotice,
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
