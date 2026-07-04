import prisma from "@/shared/db";
import { uploadUserAvatar } from "@/shared/lib/infrastructure/storage";

import type { SyncOauthAvatarData } from "./types";

// 下载第三方头像并上传到自有 S3，把返回的 URL 写入用户表
export async function processSyncOauthAvatar({
  userId,
  imageUrl,
}: SyncOauthAvatarData): Promise<void> {
  // uploadUserAvatar 内部自动 fetch 下载，key 带随机后缀做缓存刷新
  const storedUrl = await uploadUserAvatar({ userId, body: imageUrl });

  // 把自有存储 URL 写入用户表，覆盖第三方 URL
  await prisma.user.update({
    where: { id: userId },
    data: { image: storedUrl },
  });
}
