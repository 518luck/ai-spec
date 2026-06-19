import { JOB_NAMES } from "./constants";
import { backgroundJobsQueue } from "./queues";
import type { EmailChangeData, SyncOauthAvatarData } from "./types";

// 入队头像同步任务（以 avatar-sync 为 job.name 投入后台任务队列）
export async function enqueueAvatarSync(
  data: SyncOauthAvatarData,
): Promise<void> {
  await backgroundJobsQueue.add(JOB_NAMES.avatarSync, data);
}

// 入队邮箱变更验证邮件任务（以 email-change 为 job.name 投入后台任务队列）
export async function enqueueEmailChange(data: EmailChangeData): Promise<void> {
  await backgroundJobsQueue.add(JOB_NAMES.emailChange, data);
}
