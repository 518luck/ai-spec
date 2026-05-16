"use server";

import { actionClient } from "./safe-action";
import { emailSchema, passwordSchema } from "../zod/schemas/auth";
import * as z from "zod";
import { flattenValidationErrors } from "next-safe-action";
import { throwIfAuthenticated } from "./auth/throw-if-authenticated";
import { ratelimit } from "../infrastructure/redis/reatlimit";
import { getIP } from "../api/utils/get-ip";

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
  });
