import { z } from "@/shared/lib/zod";
import { tagOptionVoSchema } from "@/shared/lib/zod/schemas/tag";

// # 规约（Rule）相关 zod schema：名称、正文、文件夹归属、标签校验

// @ 拼装件
// 规约名称：必填，最多 64 字。refine 只校验纯空白，不改写用户输入
export const ruleNameSchema = z
	.string({ error: "请输入规约名称" })
	.refine((s) => s.trim().length > 0, { error: "请输入规约名称" })
	.max(64, { error: "名称长度不能超过 64 个字符" });

// 规约正文：必填，最长 10 万字（@db.Text 实际无上限，这里防滥用）。refine 只校验纯空白，不改写用户输入
export const ruleContentSchema = z
	.string({ error: "请输入规约内容" })
	.refine((s) => s.trim().length > 0, { error: "请输入规约内容" })
	.max(100_000, { error: "内容过长" });

// 规约所属文件夹：null/空串表示不加入任何文件夹
export const ruleFolderIdSchema = z.string().nullable().or(z.literal(""));

// 规约所属领域空间：省略时后端按文件夹归属推导，都没有则回落个人默认空间
export const ruleSpaceIdSchema = z.string().optional();

// @ 入参
// 创建规约入参
export const createRuleDtoSchema = z.object({
	name: ruleNameSchema,
	content: ruleContentSchema,
	folderId: ruleFolderIdSchema,
	spaceId: ruleSpaceIdSchema,
	// 标签传 id 数组；前端在 TagCombobox 里选/新建时已确保 id 存在，后端只 connect 不查
	tags: z.array(z.string()).optional(),
});

// 创建规约入参类型
export type CreateRuleDto = z.infer<typeof createRuleDtoSchema>;

// 更新规约入参：id 走 URL 路径，body 内所有字段可选（部分更新），至少更新一个
export const updateRuleDtoSchema = z
	.object({
		name: ruleNameSchema.optional(),
		content: ruleContentSchema.optional(),
		folderId: ruleFolderIdSchema.optional(),
		// 标签传 id 数组；undefined 表示不更新，空数组表示清空标签
		tags: z.array(z.string()).optional(),
	})
	.refine(
		(data) =>
			data.name !== undefined ||
			data.content !== undefined ||
			data.folderId !== undefined ||
			data.tags !== undefined,
		{ error: "至少需要更新一个字段" },
	);

// 更新规约入参类型
export type UpdateRuleDto = z.infer<typeof updateRuleDtoSchema>;

// @ 出参
// 创建规约响应
export const ruleVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	content: z.string(),
	folderId: z.string().nullable(),
	tags: z.array(tagOptionVoSchema),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

// 创建规约响应类型
export type RuleVo = z.infer<typeof ruleVoSchema>;

// 单条规约全文响应：返回 name + content（编辑回填用）+ folderId + tags（编辑回填所属文件夹与标签）
export const ruleContentVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	content: z.string(),
	folderId: z.string().nullable(),
	tags: z.array(tagOptionVoSchema),
});

// 单条规约全文响应类型
export type RuleContentVo = z.infer<typeof ruleContentVoSchema>;

// @ 出参 - 列表
// 规约列表项：列表只返回截断预览，不返回 content 全文
export const ruleListItemVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	preview: z.string(),
	folderId: z.string().nullable(),
	folderName: z.string().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

// 规约列表项类型
export type RuleListItemVo = z.infer<typeof ruleListItemVoSchema>;

// 规约列表响应（分页元信息 + 数据）
export const ruleListVoSchema = z.object({
	data: z.array(ruleListItemVoSchema),
	total: z.number(),
	hasMore: z.boolean(),
});

// 规约列表响应类型
export type RuleListVo = z.infer<typeof ruleListVoSchema>;

// 规约列表查询入参：文件夹筛选 + 标签筛选 + 搜索 + 分页
// tagIds 为逗号分隔的 tag id 列表，多选时取交集（命中其中任意一个即返回）
// page 为 1-based 页码，pageSize 为每页条数；后端内部换算为 offset 喂给 Prisma
export const listRulesDtoSchema = z.object({
	folderId: z.string().optional(),
	spaceId: ruleSpaceIdSchema,
	tagIds: z.string().optional(),
	q: z.string().optional(),
	page: z.coerce.number().int().min(1).optional(),
	pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

// 规约列表查询入参类型
export type ListRulesDto = z.infer<typeof listRulesDtoSchema>;
