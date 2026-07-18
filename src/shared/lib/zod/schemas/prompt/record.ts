import { z } from "@/shared/lib/zod";

// # 收录（Record）相关 zod schema：名称、正文、图片、文件夹归属校验

// @ 拼装件
// 收录名称：必填，最多 64 字
export const recordNameSchema = z
	.string({ error: "请输入名称" })
	.trim()
	.min(1, { error: "请输入名称" })
	.max(64, { error: "名称长度不能超过 64 个字符" });

// 收录正文：必填，最长 10 万字（@db.Text 实际无上限，这里防滥用）
export const recordContentSchema = z
	.string({ error: "请输入收录内容" })
	.trim()
	.min(1, { error: "请输入收录内容" })
	.max(100_000, { error: "内容过长" });

// 收录图片列表：可选，默认空数组
export const recordImagesSchema = z.array(z.string().max(2048)).default([]);

// 收录所属文件夹：可选，空串或 undefined 表示不加入任何文件夹
export const recordFolderIdSchema = z.string().optional().or(z.literal(""));

// @ 入参
// 创建收录入参
export const createRecordDtoSchema = z.object({
	name: recordNameSchema,
	content: recordContentSchema,
	images: recordImagesSchema,
	folderId: recordFolderIdSchema,
});

// 创建收录入参类型
export type CreateRecordDto = z.infer<typeof createRecordDtoSchema>;

// @ 出参
// 创建收录响应
export const createRecordVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	content: z.string(),
	visibility: z.enum(["private", "public"]),
	folderId: z.string().optional(),
	updatedAt: z.iso.datetime(),
});

// 创建收录响应类型
export type CreateRecordVo = z.infer<typeof createRecordVoSchema>;
