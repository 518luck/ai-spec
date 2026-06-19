import { NextResponse } from "next/server";

import prisma from "@/shared/db";
import { withSession } from "@/shared/lib/auth/with-session";
import {
  createLogger,
  serializeError,
} from "@/shared/lib/infrastructure/axiom/server";
import { enqueueDeleteUserAvatar } from "@/shared/lib/infrastructure/queue";
import { uploadUserAvatar } from "@/shared/lib/infrastructure/storage";
import { updateUserSchema } from "@/shared/lib/zod/schemas/user";

// 用户资料更新路由的专用日志作用域，自动注入 module 字段
const log = createLogger("user-route");

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

  // 更新头像前先读旧 image，用于事后清理 S3 中的旧文件
  let previousImage: string | null = null;
  if (avatar !== undefined) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });
    previousImage = current?.image ?? null;

    // 上传头像到对象存储（key 带随机后缀做缓存刷新），返回的 URL 写入用户表
    data.image = await uploadUserAvatar({ userId, body: avatar });
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

  // DB 写入成功后 best-effort 入队清理旧头像；enqueue 失败不得让接口 500
  if (previousImage) {
    await enqueueDeleteUserAvatar({
      userId,
      avatarUrl: previousImage,
    }).catch((error) => {
      log.error("入队旧头像清理任务失败", {
        userId,
        ...(error instanceof Error
          ? serializeError(error)
          : { error: String(error) }),
      });
    });
  }

  return NextResponse.json(updated);
});
