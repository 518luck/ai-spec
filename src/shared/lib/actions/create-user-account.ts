"use server";

import { v4 as uuidv4 } from "uuid";
import * as z from "zod/v4";

import prisma from "@/shared/db";
import { flattenValidationErrors } from "next-safe-action";
import { skipAuthThrottling } from "../api/environment";
import { ratelimit } from "../infrastructure/redis/reatlimit";
import { hashPassword } from "../utils";
import { signUpSchema } from "../zod/schemas/auth";
import { throwIfAuthenticated } from "./auth/throw-if-authenticated";
import { actionClient } from "./safe-action";

const OTP_ATTEMPTS = 2;
const OTP_LOCKOUT_DURATION = 24 * 60 * 60; // Block for 24 hours

const schema = signUpSchema.extend({
  code: z.string().min(6, "OTP must be 6 characters long."),
});

// 通过邮箱验证码验证注册请求
export const createUserAccountAction = actionClient
  .inputSchema(schema, {
    // 把 Zod 校验错误整理成前端更容易消费的字段级错误结构。
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .use(throwIfAuthenticated)
  .action(async ({ parsedInput }) => {
    const { email, password, code } = parsedInput;

    const signupAttemptKey = `signup:attempts:${email}`;

    if (!skipAuthThrottling) {
      // 最多尝试5次

      await ratelimit({
        key: signupAttemptKey,
        points: OTP_ATTEMPTS,
        duration: OTP_LOCKOUT_DURATION,
      });
    }

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: {
        identifier: email,
        token: code,
      },
    });

    if (!verificationToken) {
      // 验证码错误时累计一次失败次数。
      await ratelimit({
        key: signupAttemptKey,
        points: OTP_ATTEMPTS,
        duration: OTP_LOCKOUT_DURATION,
      });

      // 验证码不匹配时终止注册。
      throw new Error("输入无效的验证码");
    }

    if (verificationToken.expires && verificationToken.expires < new Date()) {
      // 过期验证码异步清理掉，避免脏数据残留。
      await prisma.emailVerificationToken.delete({
        where: {
          identifier: email,
          token: code,
        },
      });

      // 验证码过期时提示用户重新获取。
      throw new Error("验证码已经过期,请重新发送");
    }

    await prisma.emailVerificationToken.delete({
      where: {
        identifier: email,
        token: code,
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      const id = uuidv4();
      // 首次注册时创建用户，并保存密码哈希与默认通知配置。
      await prisma.user.create({
        data: {
          id,
          email,
          passwordHash: await hashPassword(password),
          emailVerified: new Date(),
        },
      });
    }

    return parsedInput;
  });
