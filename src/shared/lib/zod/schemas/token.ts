import * as z from "zod/v4";

import { PERMISSION_ACTIONS } from "@/shared/lib/ohs/local/appservice/rbac/permissions";

// name：令牌显示名称，1-50 字符，必填
const tokenNameSchema = z
  .string({ error: "请输入令牌名称" })
  .trim()
  .min(1, { error: "请输入令牌名称" })
  .max(50, { error: "名称长度不能超过 50 个字符" });

// scopes：权限范围数组，如 ["promptRecord.write", "secretKey.read"]
// 元素必须是 PERMISSION_ACTIONS 枚举里的合法值，可选，默认空数组
// 注意：前端传数组，后端会 join(" ") 存到 DB 的 scopes 字段
const tokenScopesSchema = z.array(z.enum(PERMISSION_ACTIONS)).default([]);

// 创建 API 令牌的请求入参 schema（Dto 入：前端传入待校验数据）
export const createTokenDtoSchema = z.object({
  name: tokenNameSchema,

  scopes: tokenScopesSchema,
});

// 创建令牌入参类型（供 Server Action / 路由处理器使用）
export type CreateTokenDto = z.infer<typeof createTokenDtoSchema>;
