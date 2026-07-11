import * as z from "zod/v4";

// 草稿名称：可选，最多 64 字
export const draftNameSchema = z
	.string()
	.trim()
	.max(64, { error: "名称长度不能超过 64 个字符" })
	.optional()
	.or(z.literal(""));

// 草稿描述：可选，最多 200 字
export const draftDescriptionSchema = z
	.string()
	.trim()
	.max(200, { error: "描述长度不能超过 200 个字符" })
	.optional()
	.or(z.literal(""));

// 草稿正文：必填，最长 10 万字（@db.Text 实际无上限，这里防滥用）
export const draftContentSchema = z
	.string({ error: "请输入草稿内容" })
	.trim()
	.min(1, { error: "请输入草稿内容" })
	.max(100_000, { error: "内容过长" });

// 草稿图片列表：可选，默认空数组
export const draftImagesSchema = z.array(z.string().max(2048)).default([]);

// 创建草稿的请求入参 schema（Dto 入：前端传入待校验数据）
export const createDraftDtoSchema = z.object({
	name: draftNameSchema,
	description: draftDescriptionSchema,
	content: draftContentSchema,
	images: draftImagesSchema,
});

// 创建草稿入参类型（供 Server Action / 路由处理器使用）
export type CreateDraftDto = z.infer<typeof createDraftDtoSchema>;

// 创建草稿的响应出参 schema（Vo 出：创建成功后返回给前端的数据）
export const createDraftVoSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	content: z.string(),
	updated_at: z.iso.datetime(),
});

// 创建草稿响应类型（前端消费 / 列表展示共用）
export type CreateDraftVo = z.infer<typeof createDraftVoSchema>;
