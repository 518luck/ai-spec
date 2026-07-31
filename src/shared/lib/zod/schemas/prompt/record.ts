import { z } from "@/shared/lib/zod";
import { TagSchemas } from "@/shared/lib/zod/schemas/tag";

// # 收录（Record）相关 zod schema：名称、正文、图片、文件夹归属、标签校验
// > schema 值统一收进 RecordSchemas 聚合对象，type 保留独立导出
// > 版本相关 schema 被 rules 领域复用（rules 消费侧 import { RecordSchemas } 取 versionListVo 等）

// @ 拼装件（局部变量，供 Dto/Vo 组装用）
// 收录名称：必填，最多 64 字。refine 只校验纯空白，不改写用户输入
const name = z
	.string({ error: "请输入名称" })
	.refine((s) => s.trim().length > 0, { error: "请输入名称" })
	.max(64, { error: "名称长度不能超过 64 个字符" });

// 收录正文：必填，最长 10 万字（@db.Text 实际无上限，这里防滥用）。refine 只校验纯空白，不改写用户输入
const content = z
	.string({ error: "请输入收录内容" })
	.refine((s) => s.trim().length > 0, { error: "请输入收录内容" })
	.max(100_000, { error: "内容过长" });

// 收录图片列表：可选，默认空数组
const images = z.array(z.string().max(2048)).default([]);

// 收录所属文件夹：null/空串表示不加入任何文件夹（PATCH 局部更新时靠"不传该字段"表达"不更新"，不依赖 undefined 值）
const folderId = z.string().nullable().or(z.literal(""));

// 版本编辑者信息（版本相关 Vo 共用的拼装件）
const versionEditor = z.object({
	id: z.string(),
	name: z.string(),
	image: z.string().nullable(),
});

// @ 聚合对象：所有 schema 值按「拼装件 / 入参 Dto / 出参 Vo」分组
export const RecordSchemas = {
	// @ 拼装件（也导出，消费侧可能单独用）
	name,
	content,
	images,
	folderId,

	// @ 入参 Dto
	// 创建收录入参：标签传 id 数组；前端在 TagCombobox 里选/新建时已确保 id 存在，后端只 connect 不查
	createDto: z.object({
		name,
		content,
		images,
		folderId,
		// 标签传 id 数组；前端在 TagCombobox 里选/新建时已确保 id 存在，后端只 connect 不查
		tags: z.array(z.string()).optional(),
	}),

	// 更新收录入参：id 走 URL 路径，body 内所有字段可选（部分更新），至少更新一个
	updateDto: z
		.object({
			name: name.optional(),
			content: content.optional(),
			images: images.optional(),
			folderId: folderId.optional(),
			// 标签传 id 数组；undefined 表示不更新，空数组表示清空标签
			tags: z.array(z.string()).optional(),
			// 版本说明，类似 commit message
			message: z.string().max(200, { error: "版本说明长度不能超过 200 个字符" }).optional(),
		})
		.refine(
			(data) =>
				data.name !== undefined ||
				data.content !== undefined ||
				data.images !== undefined ||
				data.folderId !== undefined ||
				data.tags !== undefined,
			{ error: "至少需要更新一个字段" },
		),

	// 删除收录入参：仅校验 id 非空（作为路由/前端参数守卫）
	deleteDto: z.object({
		id: z.string().min(1, { error: "缺少收录 id" }),
	}),

	// 收录列表查询入参：文件夹筛选 + 标签筛选 + 搜索（q + filter）+ 收藏筛选 + 排序 + 分页
	// filter 为 base64 编码的 JSON，形如 {title:true,content:true}，决定 q 搜哪些字段
	// favorite=true 时忽略 folderId，跨文件夹返回当前用户收藏的收录
	// sort=mostCopied 时按 copy_count 倒序（常用），不传或 sort=recent 走 updated_at 倒序（默认）
	listDto: z.object({
		folderId: z.string().optional(),
		tagIds: z.string().optional(), // 逗号分隔的 tag id 列表，多选时 AND 关系
		q: z.string().optional(),
		filter: z.string().optional(),
		favorite: z.coerce.boolean().optional(),
		sort: z.enum(["recent", "mostCopied"]).optional(),
		// 分页：page 为 1-based 页码
		page: z.coerce.number().int().min(1).optional(),
	}),

	// @ 出参 Vo
	// 创建收录响应
	createVo: z.object({
		id: z.string(),
		name: z.string(),
		content: z.string(),
		visibility: z.enum(["private", "public"]),
		folderId: z.string().nullable(),
		tags: z.array(TagSchemas.optionVo),
		updatedAt: z.iso.datetime(),
	}),

	// 单条收录全文响应：返回 name + content（复制全文 / 编辑回填用）+ folderId + tags（编辑回填所属文件夹与标签）
	contentVo: z.object({
		id: z.string(),
		name: z.string(),
		content: z.string(),
		folderId: z.string().nullable(),
		tags: z.array(TagSchemas.optionVo),
	}),

	// 收藏开关响应：返回最新收藏状态，前端用以同步 UI
	favoriteToggleVo: z.object({
		favorite: z.boolean(),
	}),

	// 收录列表项：列表只返回截断预览，不返回 content 全文（name 必填，区别于草稿的 nullable）
	// favorite 标记当前用户是否已收藏，驱动卡片右上角★按钮的激活态
	vo: z.object({
		id: z.string(),
		name: z.string(),
		preview: z.string(),
		favorite: z.boolean(),
	}),

	// 收录列表响应（分页元信息 + 数据）
	listVo: z.object({
		data: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				preview: z.string(),
				favorite: z.boolean(),
			}),
		),
		total: z.number(),
		hasMore: z.boolean(),
	}),

	// @ 版本历史相关 schema
	// 版本编辑者信息
	versionEditor,

	// 版本历史列表查询入参
	listVersionsDto: z.object({
		// 分页：page 为 1-based 页码
		page: z.coerce.number().int().min(1).optional(),
		pageSize: z.coerce.number().int().min(1).max(50).optional(),
	}),

	// 版本列表项
	versionVo: z.object({
		id: z.string(),
		versionNumber: z.number(),
		message: z.string().nullable(),
		isSnapshot: z.boolean(),
		createdAt: z.iso.datetime(),
		editor: versionEditor,
	}),

	// 版本历史列表响应（分页元信息 + 数据）
	versionListVo: z.object({
		data: z.array(
			z.object({
				id: z.string(),
				versionNumber: z.number(),
				message: z.string().nullable(),
				isSnapshot: z.boolean(),
				createdAt: z.iso.datetime(),
				editor: versionEditor,
			}),
		),
		total: z.number(),
		hasMore: z.boolean(),
	}),

	// 版本详情响应
	versionDetailVo: z.object({
		id: z.string(),
		versionNumber: z.number(),
		message: z.string().nullable(),
		isSnapshot: z.boolean(),
		// 收录名称：作为版本详情的标题展示（版本详情接口已验证 record 归属当前用户，name 来自所属 record）
		name: z.string(),
		content: z.string(),
		createdAt: z.iso.datetime(),
		editor: versionEditor,
	}),
} as const;

// @ 派生类型（保留独立导出，消费侧 import type）
export type CreateRecordDto = z.infer<typeof RecordSchemas.createDto>;
export type UpdateRecordDto = z.infer<typeof RecordSchemas.updateDto>;
export type DeleteRecordDto = z.infer<typeof RecordSchemas.deleteDto>;
export type ListRecordsDto = z.infer<typeof RecordSchemas.listDto>;
export type CreateRecordVo = z.infer<typeof RecordSchemas.createVo>;
export type RecordContentVo = z.infer<typeof RecordSchemas.contentVo>;
export type FavoriteToggleVo = z.infer<typeof RecordSchemas.favoriteToggleVo>;
export type RecordVo = z.infer<typeof RecordSchemas.vo>;
export type RecordListVo = z.infer<typeof RecordSchemas.listVo>;
export type ListVersionsDto = z.infer<typeof RecordSchemas.listVersionsDto>;
export type VersionVo = z.infer<typeof RecordSchemas.versionVo>;
export type VersionListVo = z.infer<typeof RecordSchemas.versionListVo>;
export type VersionDetailVo = z.infer<typeof RecordSchemas.versionDetailVo>;
