import prisma from "@/shared/db";
import type { Job } from "bullmq";
import type { SyncOauthAvatarData } from "../types";

// 下载第三方头像并更新数据库中的用户头像 URL
export async function processSyncOauthAvatar(
  job: Job<SyncOauthAvatarData>,
): Promise<void> {
  const { userId, imageUrl } = job.data;

  // TODO: 接入对象存储后，下载图片并上传到自己的存储，把返回的 URL 写入数据库
  // 目前先直接保留第三方 URL，验证队列流程是否跑通
  await prisma.user.update({
    where: { id: userId },
    data: { image: imageUrl },
  });
}
