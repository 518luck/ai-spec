import { SCOPES } from "@/server/rbac/scopes";
import { z } from "@/shared/lib/zod";

// # API 令牌（Token）相关 zod schema：创建、更新、删除入参与响应出参校验
// > schema 值统一收进 TokenSchemas 聚合对象，type 保留独立导出

// @ 拼装件（局部变量，供 Dto/Vo 组装用）
// name：令牌显示名称，1-32 字符，必填；消费侧用同一份规则做本地预校验
const name = z
	.string({ error: "请输入令牌名称" })
	.trim()
	.min(1, { error: "请输入令牌名称" })
	.max(32, { error: "名称长度不能超过 32 个字符" });

// description：令牌描述，可选，最多 200 字符，用于补充说明用途
const description = z
	.string()
	.trim()
	.max(200, { error: "描述长度不能超过 200 个字符" })
	.optional()
	.or(z.literal(""));

// scopes：权限范围数组，如 ["apis.all"]、["discover.read", "agents.write"]
// 元素必须是 SCOPES 里登记的合法 scope，可选，默认空数组
// 注意：前端传数组，后端会 join(" ") 存到 DB 的 scopes 字段
const scopes = z.array(z.enum(SCOPES)).default([]);

// partialKey 脱敏片段：固定「前缀 + 圆点 + 尾部明文」结构，限制长度防止误把完整密钥塞进来
const partialKey = z.string().min(1).max(64);

// 过期时间：接收 ISO 字符串，null/省略表示永不过期
const expires = z.iso.datetime().nullable().optional();

// @ 聚合对象：所有 schema 值按「拼装件 / 入参 Dto / 出参 Vo」分组
export const TokenSchemas = {
	// @ 拼装件（也导出，消费侧可能单独用）
	name,
	description,
	scopes,
	partialKey,
	expires,

	// @ 入参 Dto
	// 创建令牌入参
	createDto: z.object({
		name,
		description,
		scopes,
		expires,
	}),

	// 更新令牌入参
	updateDto: z.object({
		id: z.string().min(1, { error: "缺少令牌 id" }),
		name,
		description,
		scopes,
		expires,
	}),

	// 删除令牌入参
	deleteDto: z.object({
		id: z.string().min(1, { error: "缺少令牌 id" }),
	}),

	// @ 出参 Vo
	// 创建令牌响应
	// ! 明文 key 仅此一次返回，之后库里只剩哈希不可反查；其余字段供列表展示
	createVo: z.object({
		id: z.string(),
		name: z.string(),
		partialKey,
		key: z.string(),
	}),

	// 令牌列表项：服务端 select 后经命名转换；description/scopes 可空（scopes 为空格分隔串），expires 为 Date（null=永不过期）
	vo: z.object({
		id: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		partialKey,
		scopes: z.string().nullable(),
		expires: z.date().nullable(),
	}),
} as const;

// @ 派生类型（保留独立导出，消费侧 import type）
export type CreateTokenDto = z.infer<typeof TokenSchemas.createDto>;
export type UpdateTokenDto = z.infer<typeof TokenSchemas.updateDto>;
export type DeleteTokenDto = z.infer<typeof TokenSchemas.deleteDto>;
export type CreateTokenVo = z.infer<typeof TokenSchemas.createVo>;
export type TokenVo = z.infer<typeof TokenSchemas.vo>;
