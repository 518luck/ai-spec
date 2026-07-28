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
	// 原文描述（多为英文；列表「英文」态直接展示）
	description: z.string(),
	// 中文描述（机翻或原文已是中文）；无则前端中文态回落 description
	descriptionZh: z.string().nullable(),
	license: z.string().nullable(),
	sourceRepo: z.string().nullable(),
	sourceUrl: z.string().nullable(),
	authorName: z.string().nullable(),
	authorType: z.string().nullable(), // "Organization" 或 "User"
	authorAvatarUrl: z.string().nullable(),
	authorHtmlUrl: z.string().nullable(),
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

// 广场列表查询入参：搜索（q + filter）+ 组织筛选 + 热度（最低 star）+ 分页
// filter 为 base64 编码的 JSON，形如 {title:true,content:true}，决定 q 搜哪些字段
export const listDiscoverSkillsDtoSchema = z.object({
	q: z.string().optional(),
	// 字段开关：title=true 搜 name，content=true 搜 description / descriptionZh
	filter: z.string().optional(),
	// 按 GitHub 组织名筛选，逗号分隔（如 "vercel,anthropics"）
	orgs: z.string().optional(),
	// 热度门槛：只返回 stars >= minStars 的条目（如 1000 表示 star>1k）
	minStars: z.coerce.number().int().min(0).optional(),
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

// Organization 列表项（按 GitHub 组织分组，供前端侧边栏筛选）
export const organizationListItemVoSchema = z.object({
	authorName: z.string(),
	authorType: z.string().nullable(), // "Organization" 或 "User"
	authorAvatarUrl: z.string().nullable(),
	authorHtmlUrl: z.string().nullable(),
	skillCount: z.number().int(),
});

export type OrganizationListItemVo = z.infer<typeof organizationListItemVoSchema>;

// Organization 列表响应
export const organizationListVoSchema = z.object({
	data: z.array(organizationListItemVoSchema),
	total: z.number(),
});

// Organization 列表响应类型
export type OrganizationListVo = z.infer<typeof organizationListVoSchema>;

// 广场列表响应类型
export type DiscoverSkillListVo = z.infer<typeof discoverSkillListVoSchema>;

// 导入结果响应：本次入库（新增或刷新）的条目
export const importDiscoverSkillsVoSchema = z.object({
	imported: z.number().int(),
	skills: z.array(discoverSkillListItemVoSchema),
});

// 导入结果响应类型
export type ImportDiscoverSkillsVo = z.infer<typeof importDiscoverSkillsVoSchema>;
