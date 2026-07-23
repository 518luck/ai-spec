import { z } from "@/shared/lib/zod";
import { tagOptionVoSchema } from "@/shared/lib/zod/schemas/tag";

// # 收录（Record）相关 zod schema：名称、正文、图片、文件夹归属、标签校验

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

// 收录所属文件夹：null/空串表示不加入任何文件夹（PATCH 局部更新时靠"不传该字段"表达"不更新"，不依赖 undefined 值）
export const recordFolderIdSchema = z.string().nullable().or(z.literal(""));

// @ 入参
// 创建收录入参
export const createRecordDtoSchema = z.object({
	name: recordNameSchema,
	content: recordContentSchema,
	images: recordImagesSchema,
	folderId: recordFolderIdSchema,
	// 标签传 id 数组；前端在 TagCombobox 里选/新建时已确保 id 存在，后端只 connect 不查
	tags: z.array(z.string()).optional(),
});

// 创建收录入参类型
export type CreateRecordDto = z.infer<typeof createRecordDtoSchema>;

// 更新收录入参：id 走 URL 路径，body 内所有字段可选（部分更新），至少更新一个
export const updateRecordDtoSchema = z
	.object({
		name: recordNameSchema.optional(),
		content: recordContentSchema.optional(),
		images: recordImagesSchema.optional(),
		folderId: recordFolderIdSchema.optional(),
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
	);

// 更新收录入参类型
export type UpdateRecordDto = z.infer<typeof updateRecordDtoSchema>;

// 收录列表查询入参：文件夹筛选 + 标签筛选 + 搜索（q + filter）+ 收藏筛选 + 排序 + 分页
// filter 为 base64 编码的 JSON，形如 {title:true,content:true}，决定 q 搜哪些字段
// favorite=true 时忽略 folderId，跨文件夹返回当前用户收藏的收录
// sort=mostCopied 时按 copy_count 倒序（常用），不传或 sort=recent 走 updated_at 倒序（默认）
export const listRecordsDtoSchema = z.object({
	folderId: z.string().optional(),
	tagIds: z.string().optional(), // 逗号分隔的 tag id 列表，多选时 AND 关系
	q: z.string().optional(),
	filter: z.string().optional(),
	favorite: z.coerce.boolean().optional(),
	sort: z.enum(["recent", "mostCopied"]).optional(),
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
	folderId: z.string().nullable(),
	tags: z.array(tagOptionVoSchema),
	updatedAt: z.iso.datetime(),
});

// 创建收录响应类型
export type CreateRecordVo = z.infer<typeof createRecordVoSchema>;

// 单条收录全文响应：返回 name + content（复制全文 / 编辑回填用）+ folderId + tags（编辑回填所属文件夹与标签）
export const recordContentVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	content: z.string(),
	folderId: z.string().nullable(),
	tags: z.array(tagOptionVoSchema),
});

// 单条收录全文响应类型
export type RecordContentVo = z.infer<typeof recordContentVoSchema>;

// 收藏开关响应：返回最新收藏状态，前端用以同步 UI
export const favoriteToggleVoSchema = z.object({
	favorite: z.boolean(),
});

// 收藏开关响应类型
export type FavoriteToggleVo = z.infer<typeof favoriteToggleVoSchema>;

// @ 出参 - 列表
// 收录列表项：列表只返回截断预览，不返回 content 全文（name 必填，区别于草稿的 nullable）
// favorite 标记当前用户是否已收藏，驱动卡片右上角★按钮的激活态
export const recordVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	preview: z.string(),
	favorite: z.boolean(),
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

// @ 版本历史相关 schema

// @ 拼装件
// 版本编辑者信息
export const versionEditorSchema = z.object({
	id: z.string(),
	name: z.string(),
	image: z.string().nullable(),
});

// @ 入参
// 版本历史列表查询入参
export const listVersionsDtoSchema = z.object({
	offset: z.coerce.number().int().min(0).optional(),
	limit: z.coerce.number().int().min(1).max(50).optional(),
});

// 版本历史列表查询入参类型
export type ListVersionsDto = z.infer<typeof listVersionsDtoSchema>;

// @ 出参
// 版本列表项
export const versionVoSchema = z.object({
	id: z.string(),
	versionNumber: z.number(),
	message: z.string().nullable(),
	isSnapshot: z.boolean(),
	createdAt: z.iso.datetime(),
	editor: versionEditorSchema,
});

// 版本列表项类型
export type VersionVo = z.infer<typeof versionVoSchema>;

// 版本历史列表响应（分页元信息 + 数据）
export const versionListVoSchema = z.object({
	data: z.array(versionVoSchema),
	total: z.number(),
	hasMore: z.boolean(),
	nextOffset: z.number().int().min(0).optional(),
});

// 版本历史列表响应类型
export type VersionListVo = z.infer<typeof versionListVoSchema>;

// 版本详情响应
export const versionDetailVoSchema = z.object({
	id: z.string(),
	versionNumber: z.number(),
	message: z.string().nullable(),
	isSnapshot: z.boolean(),
	// 收录名称：作为版本详情的标题展示（版本详情接口已验证 record 归属当前用户，name 来自所属 record）
	name: z.string(),
	content: z.string(),
	createdAt: z.iso.datetime(),
	editor: versionEditorSchema,
});

// 版本详情响应类型
export type VersionDetailVo = z.infer<typeof versionDetailVoSchema>;
