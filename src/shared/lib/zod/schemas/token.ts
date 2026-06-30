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

// partial_key 脱敏片段：固定「前缀 + 圆点 + 尾部明文」结构，限制长度防止误把完整密钥塞进来
const partialKeySchema = z.string().min(1).max(64);

// 创建 API 令牌的请求入参 schema（Dto 入：前端传入待校验数据）
export const createTokenDtoSchema = z.object({
  name: tokenNameSchema,

  scopes: tokenScopesSchema,
});

// 创建令牌入参类型（供 Server Action / 路由处理器使用）
export type CreateTokenDto = z.infer<typeof createTokenDtoSchema>;

// 创建 API 令牌的响应出参 schema（Vo 出：创建成功后返回给前端的数据）
// 明文 key 仅此一次返回，之后库里只剩哈希不可反查；其余字段供列表展示
export const createTokenVoSchema = z.object({
  id: z.string(),
  name: z.string(),
  partial_key: partialKeySchema,
  key: z.string(),
});

// 创建令牌响应类型（前端 useAction 消费 / 列表展示共用）
export type CreateTokenVo = z.infer<typeof createTokenVoSchema>;
