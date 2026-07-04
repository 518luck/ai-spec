import { JOB_NAMES } from "../../constants";
import { backgroundJobsQueue } from "../../queues";
import type { EmailChangeData } from "./types";

// 入队邮箱变更验证邮件任务（以 email-change 为 job.name 投入后台任务队列）
export async function enqueueEmailChange(data: EmailChangeData): Promise<void> {
  await backgroundJobsQueue.add(JOB_NAMES.emailChange, data);
}
