import "server-only";

import prisma from "@/shared/db";
import type { User } from "@/shared/db/generator/client";

export type LockAccountIdentifier =
  | { readonly id: User["id"]; readonly email?: never }
  | { readonly email: User["email"]; readonly id?: never };

export type InvalidLoginAttemptResult = Pick<
  User,
  "invalidLoginAttempts" | "lockedAt"
>;

// 账号被锁定前允许的最大无效登录次数。
export const MAX_INVALID_LOGIN_ATTEMPTS = 10;

// 记录一次无效登录并在达到阈值时锁定账号。
export const recordInvalidLoginAttempt = async (
  identifier: LockAccountIdentifier,
): Promise<InvalidLoginAttemptResult> => {
  const where =
    identifier.id !== undefined
      ? { id: identifier.id }
      : { email: identifier.email };

  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.update({
      where,
      data: {
        invalidLoginAttempts: {
          increment: 1,
        },
      },
      select: {
        invalidLoginAttempts: true,
        lockedAt: true,
      },
    });

    // 如果未达到最大无效登录次数或账号已被锁定，则返回用户信息而不进行锁定。
    const shouldLockAccount =
      hasReachedMaxInvalidLoginAttempts(user) && user.lockedAt === null;

    if (!shouldLockAccount) {
      return user;
    }

    return transaction.user.update({
      where,
      data: {
        lockedAt: new Date(),
      },
      select: {
        invalidLoginAttempts: true,
        lockedAt: true,
      },
    });
  });
};

// 判断用户的无效登录次数是否已经达到锁定阈值。
export const hasReachedMaxInvalidLoginAttempts = (
  user: Pick<User, "invalidLoginAttempts">,
): boolean => {
  return user.invalidLoginAttempts >= MAX_INVALID_LOGIN_ATTEMPTS;
};
