"use server";

import { actionClient } from "@/shared/lib/ohs/actions/safe-action";
import { ActionError } from "@/shared/lib/ohs/actions/utils/action-error";
import { appConfig } from "@/shared/configs/app.config";
import prisma from "@/shared/db";
import { getIP } from "@/shared/lib/ohs/api/utils/get-ip";
import { EMAIL_OTP_EXPIRY_IN } from "@/shared/lib/auth/constants";
import { generateOTP } from "@/shared/lib/auth/utils";
import { sendEmail } from "@/shared/lib/infrastructure/email";
import VerifyEmail from "@/shared/lib/infrastructure/email/templates/verify-email";
import { ratelimit } from "@/shared/lib/infrastructure/redis/reatlimit";
import { emailSchema, passwordSchema } from "@/shared/lib/zod/schemas/auth";
import { flattenValidationErrors } from "next-safe-action";
import * as z from "zod";
import { throwIfAuthenticated } from "./throw-if-authenticated";

const schema = z.object({
  email: emailSchema,
  password: passwordSchema.optional(),
});

// 注册时发送邮箱验证码
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

    await ratelimit({
      key: `otp:send:${email}:${getIP()}`,
      points: 2,
    });

    const isExistingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (isExistingUser) {
      throw new ActionError({
        code: "CONFLICT",
        message: "用户已存在，请登录，或使用忘记密码功能",
      });
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
        subject: `用于验证您账户的验证码 - ${appConfig.appName}`,
        to: email,
        react: VerifyEmail({
          email,
          code,
        }),
      }),
    ]);
  });
