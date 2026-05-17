"use server";

import { actionClient } from "./safe-action";
import { emailSchema, passwordSchema } from "../zod/schemas/auth";
import * as z from "zod";
import { flattenValidationErrors } from "next-safe-action";
import { throwIfAuthenticated } from "./auth/throw-if-authenticated";
import { ratelimit } from "../infrastructure/redis/reatlimit";
import { getIP } from "../api/utils/get-ip";
import prisma from "@/shared/db";
import { generateOTP } from "../auth/utils";
import { EMAIL_OTP_EXPIRY_IN } from "../auth/constants";
import { sendEmail } from "../infrastructure/email";
import VerifyEmail from "../infrastructure/email/templates/verify-email";

const schema = z.object({
  email: emailSchema,
  password: passwordSchema.optional(),
});

export const sendOtpAction = actionClient
  .inputSchema(schema, {
    //当输入校验失败时，你可以自己决定“返回给前端的错误长什么样”。
    handleValidationErrorsShape: async (ve) =>
      // 这个是 next-safe-action 提供的一个工具函数。把原本比较复杂的校验错误对象，压平整理成更容易用的结构。
      flattenValidationErrors(ve).fieldErrors,
  })
  .use(throwIfAuthenticated)
  .action(async ({ parsedInput }) => {
    const { email } = parsedInput;

    const { remainingPoints } = await ratelimit(
      `send-otp:${email}:${getIP()}`,
      2,
    );

    if (remainingPoints <= 0) {
      throw new Error("请求过于频繁，请稍后再试");
    }

    const isExistingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (isExistingUser) {
      throw new Error("用户已存在，请登录,或使用忘记密码功能");
    }

    // 6. 生成新的 OTP 验证码，后面会同时写入数据库并发送邮件。
    const code = generateOTP();

    // 删除邮箱里存在的验证码,删所有匹配的行，删 0 行也不报错
    await prisma.emailVerificationToken.deleteMany({
      where: { identifier: email },
    });

    await Promise.all([
      prisma.emailVerificationToken.create({
        data: {
          identifier: email,
          token: code,
          expires: new Date(Date.now() + EMAIL_OTP_EXPIRY_IN * 1000),
        },
      }),

      sendEmail({
        subject: `${process.env.NEXT_PUBLIC_APP_NAME}: OTP to verify your account`,
        to: email,
        react: VerifyEmail({
          email,
          code,
        }),
      }),
    ]);
  });
