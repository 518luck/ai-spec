"use server";

import { flattenValidationErrors } from "next-safe-action";

import prisma from "@/shared/db";
import { hashToken } from "@/shared/lib/auth/hash-token";
import { nanoid } from "@/shared/lib/nanoid";
import { authUserActionClient } from "@/shared/lib/ohs/local/appservice/safe-action";
import { createTokenDtoSchema, createTokenVoSchema } from "@/shared/lib/zod/schemas/token";

// API Key 固定前缀，便于在列表中识别本平台签发的密钥
const API_KEY_PREFIX = "aispec_";
// API Key 随机部分长度，约 238 位熵，满足密钥强度要求
const API_KEY_LENGTH = 40;
// 脱敏展示时保留的明文尾部字符数
const PARTIAL_KEY_TAIL_LENGTH = 4;

// 创建 API 密钥：仅登录用户可调用；明文密钥只在本次返回，库里只存哈希与脱敏片段
export const createTokenAction = authUserActionClient
  .inputSchema(createTokenDtoSchema, {
    // 把 Zod 校验错误整理成前端更容易消费的字段级错误结构
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
  })
  .outputSchema(createTokenVoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, description, scopes } = parsedInput;
    const userId = ctx.user.id;

    // 用项目统一的随机串生成器产出密钥随机部分，拼上前缀作为完整密钥明文
    const rawKey = API_KEY_PREFIX + nanoid(API_KEY_LENGTH);

    // 哈希与脱敏片段互不依赖，并行计算
    const [hashedKey, partialKey] = await Promise.all([hashToken(rawKey), maskApiKey(rawKey)]);

    // 落库只存哈希与脱敏片段；scopes 数组按空格拼接，空数组存为 null；空描述存为 null
    const created = await prisma.token.create({
      data: {
        name,
        description: description || null,
        hashed_key: hashedKey,
        partial_key: partialKey,
        scopes: scopes.length > 0 ? scopes.join(" ") : null,
        user_id: userId,
      },
      select: {
        id: true,
        name: true,
        partial_key: true,
      },
    });

    // 明文密钥仅此一次返回给前端，之后无法再从库里反查
    return {
      id: created.id,
      name: created.name,
      partial_key: created.partial_key,
      key: rawKey,
    };
  });

// 把完整密钥脱敏为「前缀 + 圆点 + 尾部明文」的展示片段，避免泄露完整密钥
const maskApiKey = (rawKey: string): string =>
  `${API_KEY_PREFIX}••••${rawKey.slice(-PARTIAL_KEY_TAIL_LENGTH)}`;
