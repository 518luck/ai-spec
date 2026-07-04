import { JOB_NAMES } from "../../constants";
import { backgroundJobsQueue } from "../../queues";
import type { SyncOauthAvatarData } from "./types";

// 入队头像同步任务（以 avatar-sync 为 job.name 投入后台任务队列）
export async function enqueueAvatarSync(
  data: SyncOauthAvatarData,
): Promise<void> {
  await backgroundJobsQueue.add(JOB_NAMES.avatarSync, data);
}
