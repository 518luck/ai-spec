import prisma from "@/shared/db";
import { getS3StorageClient } from "@/shared/lib/infrastructure/storage";
import type { Job } from "bullmq";
import type { SyncOauthAvatarData } from "../types";

// 下载第三方头像并上传到自有 S3，把返回的 URL 写入用户表
export async function processSyncOauthAvatar(
  job: Job<SyncOauthAvatarData>,
): Promise<void> {
  const { userId, imageUrl } = job.data;

  // upload 内部自动 fetch 下载，key 无后缀，ContentType 靠 blob.type 兜底
  const storedUrl = await getS3StorageClient().upload({
    key: `avatars/${userId}`,
    body: imageUrl,
    visibility: "public",
  });

  // 把自有存储 URL 写入用户表，覆盖第三方 URL
  await prisma.user.update({
    where: { id: userId },
    data: { image: storedUrl },
  });
}
