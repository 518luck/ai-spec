import { getS3StorageClient } from "@/shared/lib/infrastructure/storage";

import type { DeleteUserAvatarData } from "../types";

// 删除用户旧头像：从 URL 反解 key 后调用 S3 删除；非自有桶资源静默跳过
export async function processDeleteUserAvatar({ avatarUrl }: DeleteUserAvatarData): Promise<void> {
  const client = getS3StorageClient();
  const key = client.parseKeyFromUrl(avatarUrl);
  if (!key) {
    return;
  }

  await client.delete({ key });
}
