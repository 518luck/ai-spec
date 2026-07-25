import { z } from "@/shared/lib/zod";

// # 规约（Rule）相关 zod schema：名称、正文、文件夹归属校验

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

// @ 入参
// 创建规约入参
export const createRuleDtoSchema = z.object({
	name: ruleNameSchema,
	content: ruleContentSchema,
	folderId: ruleFolderIdSchema,
});

// 创建规约入参类型
export type CreateRuleDto = z.infer<typeof createRuleDtoSchema>;

// @ 出参
// 创建规约响应
export const ruleVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	content: z.string(),
	folderId: z.string().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

// 创建规约响应类型
export type RuleVo = z.infer<typeof ruleVoSchema>;

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
	nextOffset: z.number().int().min(0).optional(),
});

// 规约列表响应类型
export type RuleListVo = z.infer<typeof ruleListVoSchema>;

// 规约列表查询入参：文件夹筛选 + 搜索 + 分页
export const listRulesDtoSchema = z.object({
	folderId: z.string().optional(),
	q: z.string().optional(),
	offset: z.coerce.number().int().min(0).optional(),
});

// 规约列表查询入参类型
export type ListRulesDto = z.infer<typeof listRulesDtoSchema>;
