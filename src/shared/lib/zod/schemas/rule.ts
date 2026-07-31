import { z } from "@/shared/lib/zod";
import { TagSchemas } from "@/shared/lib/zod/schemas/tag";

// # 规约（Rule）相关 zod schema：名称、正文、文件夹归属、标签校验
// > schema 值统一收进 RuleSchemas 聚合对象，type 保留独立导出

// @ 拼装件（局部变量，供 Dto 组装用）
// 规约名称：必填，最多 64 字。refine 只校验纯空白，不改写用户输入
const name = z
	.string({ error: "请输入规约名称" })
	.refine((s) => s.trim().length > 0, { error: "请输入规约名称" })
	.max(64, { error: "名称长度不能超过 64 个字符" });

// 规约正文：必填，最长 10 万字（@db.Text 实际无上限，这里防滥用）。refine 只校验纯空白，不改写用户输入
const content = z
	.string({ error: "请输入规约内容" })
	.refine((s) => s.trim().length > 0, { error: "请输入规约内容" })
	.max(100_000, { error: "内容过长" });

// 规约所属文件夹：null/空串表示不加入任何文件夹
const folderId = z.string().nullable().or(z.literal(""));

// 规约所属领域空间：省略时后端按文件夹归属推导，都没有则回落个人默认空间
const spaceId = z.string().optional();

// @ 出参 Vo - 列表
// 规约列表项：列表只返回截断预览，不返回 content 全文
const listItemVo = z.object({
	id: z.string(),
	name: z.string(),
	preview: z.string(),
	folderId: z.string().nullable(),
	folderName: z.string().nullable(),
	// 列表只读展示标签（颜色点 + 名称），与单条详情同构
	tags: z.array(TagSchemas.optionVo),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

// @ 聚合对象：所有 schema 值按「拼装件 / 入参 Dto / 出参 Vo」分组
export const RuleSchemas = {
	// @ 拼装件（也导出，消费侧可能单独用）
	name,
	content,
	folderId,
	spaceId,

	// @ 入参 Dto
	// 创建规约入参
	createDto: z.object({
		name,
		content,
		folderId,
		spaceId,
		// 标签传 id 数组；前端在 TagCombobox 里选/新建时已确保 id 存在，后端只 connect 不查
		tags: z.array(z.string()).optional(),
	}),

	// 更新规约入参：id 走 URL 路径，body 内所有字段可选（部分更新），至少更新一个
	updateDto: z
		.object({
			name: name.optional(),
			content: content.optional(),
			folderId: folderId.optional(),
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
		),

	// 规约列表查询入参：文件夹筛选 + 标签筛选 + 搜索 + 分页
	// tagIds 为逗号分隔的 tag id 列表，多选时取交集（命中其中任意一个即返回）
	// page 为 1-based 页码，pageSize 为每页条数；后端内部换算为 offset 喂给 Prisma
	listDto: z.object({
		folderId: z.string().optional(),
		spaceId,
		tagIds: z.string().optional(),
		q: z.string().optional(),
		page: z.coerce.number().int().min(1).optional(),
		pageSize: z.coerce.number().int().min(1).max(100).optional(),
	}),

	// @ 出参 Vo
	// 创建规约响应
	vo: z.object({
		id: z.string(),
		name: z.string(),
		content: z.string(),
		folderId: z.string().nullable(),
		tags: z.array(TagSchemas.optionVo),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	}),

	// 单条规约全文响应：返回 name + content（编辑回填用）+ folderId + tags（编辑回填所属文件夹与标签）
	contentVo: z.object({
		id: z.string(),
		name: z.string(),
		content: z.string(),
		folderId: z.string().nullable(),
		tags: z.array(TagSchemas.optionVo),
	}),

	// 规约列表项
	listItemVo,

	// 规约列表响应（分页元信息 + 数据）
	listVo: z.object({
		data: z.array(listItemVo),
		total: z.number(),
		hasMore: z.boolean(),
	}),
} as const;

// @ 派生类型（保留独立导出，消费侧 import type）
export type CreateRuleDto = z.infer<typeof RuleSchemas.createDto>;
export type UpdateRuleDto = z.infer<typeof RuleSchemas.updateDto>;
export type ListRulesDto = z.infer<typeof RuleSchemas.listDto>;
export type RuleVo = z.infer<typeof RuleSchemas.vo>;
export type RuleContentVo = z.infer<typeof RuleSchemas.contentVo>;
export type RuleListItemVo = z.infer<typeof RuleSchemas.listItemVo>;
export type RuleListVo = z.infer<typeof RuleSchemas.listVo>;
