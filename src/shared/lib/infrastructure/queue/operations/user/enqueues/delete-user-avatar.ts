import { JOB_NAMES } from "../../../constants";
import { backgroundJobsQueue } from "../../../queues";
import type { DeleteUserAvatarData } from "../types";

// 入队用户旧头像删除任务（以 avatar-cleanup 为 job.name 投入后台任务队列）
export async function enqueueDeleteUserAvatar(
  data: DeleteUserAvatarData,
): Promise<void> {
  await backgroundJobsQueue.add(JOB_NAMES.avatarCleanup, data);
}
