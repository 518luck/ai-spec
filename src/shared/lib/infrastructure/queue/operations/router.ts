import type { Job } from "bullmq";

import { JOB_NAMES } from "../constants";
import type {
  BackgroundJobData,
  DeleteUserAvatarData,
  EmailChangeData,
  EmailChangedNoticeData,
  SyncOauthAvatarData,
} from "../types";
import { processDeleteUserAvatar } from "./delete-user-avatar";
import { processEmailChange } from "./email-change";
import { processEmailChangedNotice } from "./email-changed-notice";
import { processSyncOauthAvatar } from "./sync-oauth-avatar";

// avatar-sync 任务数据类型守卫
const isAvatarSyncData = (data: unknown): data is SyncOauthAvatarData =>
  typeof data === "object" &&
  data !== null &&
  "userId" in data &&
  "imageUrl" in data;

// avatar-cleanup 任务数据类型守卫
const isDeleteUserAvatarData = (data: unknown): data is DeleteUserAvatarData =>
  typeof data === "object" &&
  data !== null &&
  "userId" in data &&
  "avatarUrl" in data;

// email-change 任务数据类型守卫
const isEmailChangeData = (data: unknown): data is EmailChangeData =>
  typeof data === "object" &&
  data !== null &&
  "to" in data &&
  "token" in data &&
  "oldEmail" in data &&
  "newEmail" in data;

// email-changed-notice 任务数据类型守卫
const isEmailChangedNoticeData = (
  data: unknown,
): data is EmailChangedNoticeData =>
  typeof data === "object" && data !== null && "to" in data && "newEmail" in data;

// 后台任务总路由：按 job.name 用类型守卫收窄数据后分发到对应处理器
export async function processBackgroundJob(
  job: Job<BackgroundJobData>,
): Promise<void> {
  switch (job.name) {
    case JOB_NAMES.avatarSync:
      if (!isAvatarSyncData(job.data)) {
        throw new Error("avatar-sync 任务数据格式不正确");
      }
      return processSyncOauthAvatar(job.data);
    case JOB_NAMES.avatarCleanup:
      if (!isDeleteUserAvatarData(job.data)) {
        throw new Error("avatar-cleanup 任务数据格式不正确");
      }
      return processDeleteUserAvatar(job.data);
    case JOB_NAMES.emailChange:
      if (!isEmailChangeData(job.data)) {
        throw new Error("email-change 任务数据格式不正确");
      }
      return processEmailChange(job.data);
    case JOB_NAMES.emailChangedNotice:
      if (!isEmailChangedNoticeData(job.data)) {
        throw new Error("email-changed-notice 任务数据格式不正确");
      }
      return processEmailChangedNotice(job.data);
    default:
      throw new Error(`未知的后台任务类型: ${job.name}`);
  }
}
