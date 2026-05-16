"use server";
import { actionClient } from "./safe-action";
import { emailSchema, passwordSchema } from "../zod/schemas/auth";
import * as z from "zod";
import { flattenValidationErrors } from "next-safe-action";

const schema = z.object({
  email: emailSchema,
  password: passwordSchema.optional(),
});

export const sendOtpAction = actionClient.inputSchema(schema, {
  //当输入校验失败时，你可以自己决定“返回给前端的错误长什么样”。
  handleValidationErrorsShape: async (ve) =>
    // 这个是 next-safe-action 提供的一个工具函数。把原本比较复杂的校验错误对象，压平整理成更容易用的结构。
    flattenValidationErrors(ve).fieldErrors,
});
