import * as z from "zod/v4";

import { SCOPES } from "@/server/rbac/scopes";

// # API 令牌（Token）相关 zod schema：创建、更新、删除入参与响应出参校验

// name：令牌显示名称，1-32 字符，必填；导出供前端提交前用同一份规则做本地预校验
export const tokenNameSchema = z
	.string({ error: "请输入令牌名称" })
	.trim()
	.min(1, { error: "请输入令牌名称" })
	.max(32, { error: "名称长度不能超过 32 个字符" });

// description：令牌描述，可选，最多 200 字符，用于补充说明用途
export const tokenDescriptionSchema = z
	.string()
	.trim()
	.max(200, { error: "描述长度不能超过 200 个字符" })
	.optional()
	.or(z.literal(""));

// scopes：权限范围数组，如 ["apis.all"]、["skills.read", "agents.write"]
// 元素必须是 SCOPES 里登记的合法 scope，可选，默认空数组
// 注意：前端传数组，后端会 join(" ") 存到 DB 的 scopes 字段
const tokenScopesSchema = z.array(z.enum(SCOPES)).default([]);

// partial_key 脱敏片段：固定「前缀 + 圆点 + 尾部明文」结构，限制长度防止误把完整密钥塞进来
const partialKeySchema = z.string().min(1).max(64);

// 过期时间：接收 ISO 字符串，null/省略表示永不过期
const tokenExpiresSchema = z.iso.datetime().nullable().optional();

// 创建 API 令牌的请求入参 schema（Dto 入：前端传入待校验数据）
export const createTokenDtoSchema = z.object({
	name: tokenNameSchema,
	description: tokenDescriptionSchema,
	scopes: tokenScopesSchema,
	expires: tokenExpiresSchema,
});

// 创建令牌入参类型（供 Server Action / 路由处理器使用）
export type CreateTokenDto = z.infer<typeof createTokenDtoSchema>;

// 创建 API 令牌的响应出参 schema（Vo 出：创建成功后返回给前端的数据）
// ! 明文 key 仅此一次返回，之后库里只剩哈希不可反查；其余字段供列表展示
export const createTokenVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	partial_key: partialKeySchema,
	key: z.string(),
});

// 创建令牌响应类型（前端 useAction 消费 / 列表展示共用）
export type CreateTokenVo = z.infer<typeof createTokenVoSchema>;

// 删除 API 令牌的请求入参 schema（Dto 入：仅需令牌 id）
export const deleteTokenDtoSchema = z.object({
	id: z.string().min(1, { error: "缺少令牌 id" }),
});

// 删除令牌入参类型
export type DeleteTokenDto = z.infer<typeof deleteTokenDtoSchema>;

// 更新 API 令牌的请求入参 schema（id 必填；name/description/scopes/expires 为可编辑字段，复用创建校验规则）
export const updateTokenDtoSchema = z.object({
	id: z.string().min(1, { error: "缺少令牌 id" }),
	name: tokenNameSchema,
	description: tokenDescriptionSchema,
	scopes: tokenScopesSchema,
	expires: tokenExpiresSchema,
});

// 更新令牌入参类型（供 Server Action 使用）
export type UpdateTokenDto = z.infer<typeof updateTokenDtoSchema>;
