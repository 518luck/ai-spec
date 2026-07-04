import { nanoid } from "@/shared/lib/nanoid";

import { getS3StorageClient } from "../client";

// 上传用户头像到公共桶并返回 URL，key 带随机后缀做缓存刷新
export async function uploadUserAvatar({
  userId,
  body,
}: {
  userId: string;
  body: string;
}): Promise<string> {
  // data URL 自带 MIME，但 base64ToBlob 会剥掉，这里补回 content-type
  const isDataUrl = body.startsWith("data:");
  const contentType = isDataUrl ? body.match(/^data:(image\/[a-zA-Z0-9.+-]+);/)?.[1] : undefined;

  return getS3StorageClient().upload({
    key: `avatars/${userId}/${nanoid()}`,
    body,
    options: contentType ? { contentType } : undefined,
    visibility: "public",
  });
}
