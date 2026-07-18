import { z } from "@/shared/lib/zod";

// # 收录（Record）相关 zod schema：名称、正文、图片、文件夹归属校验

// @ 拼装件
// 收录名称：必填，最多 64 字。refine 只校验纯空白，不改写用户输入
export const recordNameSchema = z
	.string({ error: "请输入名称" })
	.refine((s) => s.trim().length > 0, { error: "请输入名称" })
	.max(64, { error: "名称长度不能超过 64 个字符" });

// 收录正文：必填，最长 10 万字（@db.Text 实际无上限，这里防滥用）。refine 只校验纯空白，不改写用户输入
export const recordContentSchema = z
	.string({ error: "请输入收录内容" })
	.refine((s) => s.trim().length > 0, { error: "请输入收录内容" })
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

// 更新收录入参：id 必填，其余字段可选，至少更新一个
export const updateRecordDtoSchema = z
	.object({
		id: z.string().min(1, { error: "缺少收录 id" }),
		name: recordNameSchema,
		content: recordContentSchema,
		images: recordImagesSchema,
		folderId: recordFolderIdSchema,
	})
	.refine(
		(data) =>
			data.name !== undefined ||
			data.content !== undefined ||
			data.images !== undefined ||
			data.folderId !== undefined,
		{ error: "至少需要更新一个字段" },
	);

// 更新收录入参类型
export type UpdateRecordDto = z.infer<typeof updateRecordDtoSchema>;

// 收录列表查询入参：仅分页（无搜索/文件夹筛选）
export const listRecordsDtoSchema = z.object({
	offset: z.coerce.number().int().min(0).optional(),
});

// 收录列表查询入参类型
export type ListRecordsDto = z.infer<typeof listRecordsDtoSchema>;

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

// 单条收录全文响应：仅返回复制所需的 content（卡片复制全文时按需拉取，列表仍只返回截断预览）
export const recordContentVoSchema = z.object({
	id: z.string(),
	content: z.string(),
});

// 单条收录全文响应类型
export type RecordContentVo = z.infer<typeof recordContentVoSchema>;

// @ 出参 - 列表
// 收录列表项：列表只返回截断预览，不返回 content 全文（name 必填，区别于草稿的 nullable）
export const recordVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	preview: z.string(),
});

// 收录列表项类型
export type RecordVo = z.infer<typeof recordVoSchema>;

// 收录列表响应（分页元信息 + 数据）
export const recordListVoSchema = z.object({
	data: z.array(recordVoSchema),
	total: z.number(),
	hasMore: z.boolean(),
	nextOffset: z.number().int().min(0).optional(),
});

// 收录列表响应类型
export type RecordListVo = z.infer<typeof recordListVoSchema>;
