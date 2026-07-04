import "server-only";

import prisma from "@/shared/db";
import { hashToken } from "@/shared/lib/auth/hash-token";
import { skipAuthThrottling } from "@/shared/lib/infrastructure/environment";
import { enqueueEmailChange } from "@/shared/lib/infrastructure/queue";
import { kvSet } from "@/shared/lib/infrastructure/redis/kv";
import { hardDailyRatelimit } from "@/shared/lib/infrastructure/redis/reatlimit";
import { nanoid } from "@/shared/lib/nanoid";

// 邮箱变更 token 有效期（毫秒），数据库过期与 Redis TTL 保持一致
const EMAIL_CHANGE_TTL_MS = 15 * 60 * 1000;

// 邮箱变更 token 在 Redis 中的 TTL（秒），与数据库过期一致
const EMAIL_CHANGE_TTL_SECONDS = EMAIL_CHANGE_TTL_MS / 1000;

// 发起邮箱变更：限流 → 清旧 token → 生成新 token → 写库 → Redis 存新旧邮箱 → 入队发确认邮件
export async function requestEmailChange({
  oldEmail,
  newEmail,
  userId,
}: {
  oldEmail: string;
  newEmail: string;
  userId: string;
}): Promise<void> {
  // 每日 10 次硬限：用硬性每日限流器，超额锁到当天窗口结束；本地开发/CI 跳过限流
  if (!skipAuthThrottling) {
    await hardDailyRatelimit({ key: `request:${userId}` });
  }

  // 清理该用户的历史 VerificationToken，避免遗留
  await prisma.verificationToken.deleteMany({
    where: { identifier: userId },
  });

  // 生成随机 token：数据库存哈希、邮件链接带原文，避免 DB 泄露暴露可用 token
  const token = nanoid(32);
  const expires = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);
  const hashed = await hashToken(token);

  await prisma.verificationToken.create({
    data: { identifier: userId, token: hashed, expires },
  });

  // Redis 存新旧邮箱与用户标识，供验证端核对；TTL 与数据库过期一致
  await kvSet(`email-change:${hashed}`, { oldEmail, newEmail, userId }, EMAIL_CHANGE_TTL_SECONDS);

  // 入队异步发送确认邮件
  await enqueueEmailChange({ to: newEmail, token, oldEmail, newEmail });
}
