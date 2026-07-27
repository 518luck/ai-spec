import { z } from "@/shared/lib/zod";

// # DiscoverSkill（发现广场）相关 zod schema：GitHub 导入入参与广场列表出参

// @ 拼装件
// GitHub 来源链接：仅接受 github.com 的仓库主页或 tree/blob 子路径链接
const githubUrlSchema = z
	.string({ error: "请输入 GitHub 链接" })
	.trim()
	.refine(
		(s) => {
			try {
				return new URL(s).hostname === "github.com";
			} catch {
				return false;
			}
		},
		{ error: "仅支持 github.com 仓库链接" },
	);

// 广场列表项（导入结果同样复用此形状）
const discoverSkillListItemVoSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	license: z.string().nullable(),
	sourceRepo: z.string().nullable(),
	sourceUrl: z.string().nullable(),
	authorName: z.string().nullable(),
	stars: z.number().int(),
	// 是否存有 SKILL.md 全文（无 license 的条目只索引元数据，"复制到我的空间"不可用）
	hasContent: z.boolean(),
	updatedAt: z.iso.datetime(),
});

// @ 入参
// 按 URL 导入入参：粘贴一个 GitHub 仓库或子目录链接
export const importDiscoverSkillsDtoSchema = z.object({
	url: githubUrlSchema,
});

// 按 URL 导入入参类型
export type ImportDiscoverSkillsDto = z.infer<typeof importDiscoverSkillsDtoSchema>;

// 广场列表查询入参：搜索 + 分页
export const listDiscoverSkillsDtoSchema = z.object({
	q: z.string().optional(),
	offset: z.coerce.number().int().min(0).optional(),
});

// 广场列表查询入参类型
export type ListDiscoverSkillsDto = z.infer<typeof listDiscoverSkillsDtoSchema>;

// @ 出参
// 广场列表项类型
export type DiscoverSkillListItemVo = z.infer<typeof discoverSkillListItemVoSchema>;

// 广场列表响应（分页元信息 + 数据）
export const discoverSkillListVoSchema = z.object({
	data: z.array(discoverSkillListItemVoSchema),
	total: z.number(),
	hasMore: z.boolean(),
	nextOffset: z.number().int().min(0).optional(),
});

// 广场列表响应类型
export type DiscoverSkillListVo = z.infer<typeof discoverSkillListVoSchema>;

// 导入结果响应：本次入库（新增或刷新）的条目
export const importDiscoverSkillsVoSchema = z.object({
	imported: z.number().int(),
	skills: z.array(discoverSkillListItemVoSchema),
});

// 导入结果响应类型
export type ImportDiscoverSkillsVo = z.infer<typeof importDiscoverSkillsVoSchema>;
