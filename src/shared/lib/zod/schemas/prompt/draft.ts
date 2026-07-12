import * as z from "zod/v4";

// # 草稿（Draft）相关 zod schema：名称、描述、正文、图片、文件夹归属校验

// @ 拼装件
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

// 草稿所属文件夹：可选，空串或 undefined 表示不加入任何文件夹
export const draftFolderIdSchema = z.string().optional().or(z.literal(""));

// @ 入参
// 创建草稿入参
export const createDraftDtoSchema = z.object({
	name: draftNameSchema,
	description: draftDescriptionSchema,
	content: draftContentSchema,
	images: draftImagesSchema,
	folder_id: draftFolderIdSchema,
});

// 创建草稿入参类型
export type CreateDraftDto = z.infer<typeof createDraftDtoSchema>;

// @ 出参
// 创建草稿响应
export const createDraftVoSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	content: z.string(),
	updated_at: z.iso.datetime(),
});

// 创建草稿响应类型
export type CreateDraftVo = z.infer<typeof createDraftVoSchema>;
