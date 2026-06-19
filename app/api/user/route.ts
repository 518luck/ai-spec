import { NextResponse } from "next/server";

import prisma from "@/shared/db";
import { withSession } from "@/shared/lib/auth/with-session";
import { getS3StorageClient } from "@/shared/lib/infrastructure/storage";
import { nanoid } from "@/shared/lib/nanoid";
import { updateUserSchema } from "@/shared/lib/zod/schemas/user";

// 更新当前登录用户资料：name 写库，avatar 走对象存储；email / defaultWorkspace 占位静默忽略
export const PATCH = withSession(async ({ req, session }) => {
  const parsed = updateUserSchema.safeParse(await req.json());
  if (!parsed.success) {
    throw parsed.error;
  }
  const { name, email, avatar, defaultWorkspace } = parsed.data;

  const userId = session.user.id;
  const data: { name?: string; image?: string } = {};

  if (name !== undefined) {
    data.name = name;
  }

  if (avatar !== undefined) {
    // 从 data URL 提取 content-type，key 采用 avatars/{id}/{随机串} 以刷新缓存
    const contentType = avatar.match(/^data:(image\/[a-zA-Z0-9.+-]+);/)?.[1];
    data.image = await getS3StorageClient().upload({
      key: `avatars/${userId}/${nanoid()}`,
      body: avatar,
      options: contentType ? { contentType } : undefined,
      visibility: "public",
    });
  }

  // TODO: email 修改需双因素验证后实现，当前校验通过但不写库
  // TODO: defaultWorkspace 等工作空间功能上线后实现，当前校验通过但不写库
  void email;
  void defaultWorkspace;

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json(updated);
});
