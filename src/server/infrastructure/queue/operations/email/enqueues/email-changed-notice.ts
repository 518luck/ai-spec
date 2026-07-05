import { JOB_NAMES } from "../../../constants";
import { backgroundJobsQueue } from "../../../queues";
import type { EmailChangedNoticeData } from "../types";

// 入队邮箱变更成功通知任务（以 email-changed-notice 为 job.name 投入后台任务队列）
export async function enqueueEmailChangedNotice(data: EmailChangedNoticeData): Promise<void> {
	await backgroundJobsQueue.add(JOB_NAMES.emailChangedNotice, data);
}
