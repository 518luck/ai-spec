import { z } from "@/shared/lib/zod";

// # 草稿（Draft）相关 zod schema：名称、正文、图片、文件夹归属校验
// > schema 值统一收进 DraftSchemas 聚合对象，type 保留独立导出

// @ 拼装件（局部变量，供 Dto 组装用）
const name = z
	.string({ error: "请输入名称" })
	.refine((s) => s.trim().length > 0, { error: "请输入名称" })
	.max(64, { error: "名称长度不能超过 64 个字符" });

const content = z
	.string({ error: "请输入草稿内容" })
	.refine((s) => s.trim().length > 0, { error: "请输入草稿内容" })
	.max(100_000, { error: "内容过长" });

// 草稿图片列表：可选，默认空数组
const images = z.array(z.string().max(2048)).default([]);

// 草稿所属文件夹：null/空串表示不加入任何文件夹（PATCH 局部更新时靠"不传该字段"表达"不更新"，不依赖 undefined 值）
const folderId = z.string().nullable().or(z.literal(""));

// @ 聚合对象：所有 schema 值按「拼装件 / 入参 Dto / 出参 Vo」分组
export const DraftSchemas = {
	// @ 拼装件（也导出，消费侧可能单独用）
	name,
	content,
	images,
	folderId,

	// @ 入参 Dto
	// 创建草稿入参
	createDto: z.object({ name, content, images, folderId }),

	// 更新草稿入参：id 走 URL 路径，body 内所有字段可选（部分更新）
	updateDto: z
		.object({
			name: name.optional(),
			content: content.optional(),
			images: images.optional(),
			folderId: folderId.optional(),
		})
		.refine(
			(data) =>
				data.name !== undefined ||
				data.content !== undefined ||
				data.images !== undefined ||
				data.folderId !== undefined,
			{ error: "至少需要更新一个字段" },
		),

	// 删除草稿入参：仅校验 id 非空（作为路由/前端参数守卫）
	deleteDto: z.object({
		id: z.string().min(1, { error: "缺少草稿 id" }),
	}),

	// 草稿列表查询入参：搜索词（q）、字段筛选（filter，base64 编码的 JSON）、文件夹、分页
	listDto: z.object({
		q: z.string().optional(),
		filter: z.string().optional(),
		folderId: z.string().optional(),
		// 分页：page 为 1-based 页码
		page: z.coerce.number().int().min(1).optional(),
	}),

	// @ 出参 Vo
	// 创建草稿响应
	createVo: z.object({
		id: z.string(),
		name: z.string(),
		content: z.string(),
		folderId: z.string().nullable(),
		updatedAt: z.iso.datetime(),
	}),

	// 单条草稿全文响应：仅返回编辑/复制所需的字段（name 可能为空，区别于 record 的必填）
	contentVo: z.object({
		id: z.string(),
		name: z.string().nullable(),
		content: z.string(),
		folderId: z.string().nullable(),
	}),

	// 草稿列表项：列表只返回截断预览，不返回 content 全文
	vo: z.object({
		id: z.string(),
		name: z.string(),
		preview: z.string(),
	}),

	// 草稿列表响应（分页元信息 + 数据）
	listVo: z.object({
		data: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				preview: z.string(),
			}),
		),
		total: z.number(),
		hasMore: z.boolean(),
	}),
} as const;

// @ 派生类型（保留独立导出，消费侧 import type）
export type CreateDraftDto = z.infer<typeof DraftSchemas.createDto>;
export type UpdateDraftDto = z.infer<typeof DraftSchemas.updateDto>;
export type DeleteDraftDto = z.infer<typeof DraftSchemas.deleteDto>;
export type ListDraftsDto = z.infer<typeof DraftSchemas.listDto>;
export type CreateDraftVo = z.infer<typeof DraftSchemas.createVo>;
export type DraftContentVo = z.infer<typeof DraftSchemas.contentVo>;
export type DraftVo = z.infer<typeof DraftSchemas.vo>;
export type DraftListVo = z.infer<typeof DraftSchemas.listVo>;
