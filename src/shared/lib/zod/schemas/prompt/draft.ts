import { z } from "@/shared/lib/zod";

// # 草稿（Draft）相关 zod schema：名称、正文、图片、文件夹归属校验

// @ 拼装件
// 草稿名称：可选，最多 64 字
export const draftNameSchema = z
	.string()
	.trim()
	.max(64, { error: "名称长度不能超过 64 个字符" })
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
	content: draftContentSchema,
	images: draftImagesSchema,
	folderId: draftFolderIdSchema,
});

// 创建草稿入参类型
export type CreateDraftDto = z.infer<typeof createDraftDtoSchema>;

// 更新草稿入参：id 必填，其余字段全部可选（部分更新）
export const updateDraftDtoSchema = z
	.object({
		id: z.string().min(1, { error: "缺少草稿 id" }),
		name: draftNameSchema,
		content: draftContentSchema,
		images: draftImagesSchema,
		folderId: draftFolderIdSchema,
	})
	.refine(
		(data) =>
			data.name !== undefined ||
			data.content !== undefined ||
			data.images !== undefined ||
			data.folderId !== undefined,
		{ error: "至少需要更新一个字段" },
	);

// 更新草稿入参类型
export type UpdateDraftDto = z.infer<typeof updateDraftDtoSchema>;

// 删除草稿入参：仅校验 id 非空（作为路由/前端参数守卫）
export const deleteDraftDtoSchema = z.object({
	id: z.string().min(1, { error: "缺少草稿 id" }),
});

// 删除草稿入参类型
export type DeleteDraftDto = z.infer<typeof deleteDraftDtoSchema>;

// 草稿列表查询入参：搜索词、排序方式、文件夹筛选、分页偏移
export const listDraftsDtoSchema = z.object({
	query: z.string().trim().optional(),
	sort: z.enum(["created", "updated"]).optional(),
	folderId: z.string().optional(),
	offset: z.coerce.number().int().min(0).optional(),
});

// 草稿列表查询入参类型
export type ListDraftsDto = z.infer<typeof listDraftsDtoSchema>;

// @ 出参
// 创建草稿响应
export const createDraftVoSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	content: z.string(),
	folderId: z.string().optional(),
	updatedAt: z.iso.datetime(),
});

// 创建草稿响应类型
export type CreateDraftVo = z.infer<typeof createDraftVoSchema>;

// @ 出参 - 列表
// 草稿列表项：列表只返回截断预览，不返回 content 全文
export const draftVoSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	preview: z.string(),
});

// 草稿列表项类型
export type DraftVo = z.infer<typeof draftVoSchema>;

// 草稿列表响应（分页元信息 + 数据）
export const draftListVoSchema = z.object({
	data: z.array(draftVoSchema),
	total: z.number(),
	hasMore: z.boolean(),
	nextOffset: z.number().int().min(0).optional(),
});

// 草稿列表响应类型
export type DraftListVo = z.infer<typeof draftListVoSchema>;
