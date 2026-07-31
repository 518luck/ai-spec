import { z } from "@/shared/lib/zod";

// # DiscoverSkill（发现广场）相关 zod schema：GitHub 导入入参与广场列表出参
// > schema 值统一收进 DiscoverSkillSchemas 聚合对象，type 保留独立导出

// @ 拼装件（局部变量，供 Dto/Vo 组装用）
// GitHub 来源链接：仅接受 github.com 的仓库主页或 tree/blob 子路径链接
const githubUrl = z
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
const listItemVo = z.object({
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
	updatedAt: z.iso.datetime(),
});

// Organization 列表项（按 GitHub 组织分组，供前端侧边栏筛选）
const organizationListItemVo = z.object({
	authorName: z.string(),
	authorType: z.string().nullable(), // "Organization" 或 "User"
	authorAvatarUrl: z.string().nullable(),
	authorHtmlUrl: z.string().nullable(),
	skillCount: z.number().int(),
});

// 反馈原因枚举（与 Prisma DiscoverSkillReportReason 对齐）
const reportReason = z.enum(["lowQuality", "inappropriate", "spam", "licenseIssue", "other"]);

// 反馈处理状态（预留运营；与 Prisma 对齐）
const reportStatus = z.enum(["open", "reviewed", "dismissed"]);

// @ 聚合对象：所有 schema 值按「拼装件 / 入参 Dto / 出参 Vo / 枚举」分组
export const DiscoverSkillSchemas = {
	// @ 拼装件（也导出，消费侧可能单独用）
	githubUrl,
	listItemVo,
	organizationListItemVo,
	reportReason,
	reportStatus,

	// @ 入参 Dto
	// 按 URL 导入入参：粘贴一个 GitHub 仓库或子目录链接
	importDto: z.object({
		url: githubUrl,
	}),

	// 广场列表查询入参：搜索（q + filter）+ 组织筛选 + 热度（最低 star）+ 分页
	// filter 为 base64 编码的 JSON，形如 {title:true,description:true}，决定 q 搜哪些字段
	listDto: z.object({
		q: z.string().optional(),
		// 字段开关：title=true 搜 name，description=true 搜 description / descriptionZh
		filter: z.string().optional(),
		// 按 GitHub 组织名筛选，逗号分隔（如 "vercel,anthropics"）
		orgs: z.string().optional(),
		// 热度门槛：只返回 stars >= minStars 的条目（如 1000 表示 star>1k）
		minStars: z.coerce.number().int().min(0).optional(),
		// 分页：page 为 1-based 页码
		page: z.coerce.number().int().min(1).optional(),
	}),

	// 提交反馈入参：原因必选，备注可选
	reportDto: z.object({
		reason: reportReason,
		// 可选补充说明；空串按未填处理
		detail: z
			.string()
			.trim()
			.max(500, { error: "补充说明最多 500 字" })
			.optional()
			.transform((v) => (v && v.length > 0 ? v : undefined)),
	}),

	// @ 出参 Vo
	// 广场列表响应（分页元信息 + 数据）
	listVo: z.object({
		data: z.array(listItemVo),
		total: z.number(),
		hasMore: z.boolean(),
	}),

	// Organization 列表响应
	organizationListVo: z.object({
		data: z.array(organizationListItemVo),
		total: z.number(),
	}),

	// 导入结果响应：本次入库（新增或刷新）的条目
	importVo: z.object({
		imported: z.number().int(),
		skills: z.array(listItemVo),
	}),

	// 提交反馈出参
	reportVo: z.object({
		id: z.string(),
		skillId: z.string(),
		reason: reportReason,
		status: reportStatus,
		createdAt: z.iso.datetime(),
	}),
} as const;

// @ 派生类型（保留独立导出，消费侧 import type）
export type ImportDiscoverSkillsDto = z.infer<typeof DiscoverSkillSchemas.importDto>;
export type ListDiscoverSkillsDto = z.infer<typeof DiscoverSkillSchemas.listDto>;
export type ReportDiscoverSkillDto = z.infer<typeof DiscoverSkillSchemas.reportDto>;
export type DiscoverSkillReportReason = z.infer<typeof DiscoverSkillSchemas.reportReason>;
export type DiscoverSkillListItemVo = z.infer<typeof DiscoverSkillSchemas.listItemVo>;
export type DiscoverSkillListVo = z.infer<typeof DiscoverSkillSchemas.listVo>;
export type OrganizationListItemVo = z.infer<typeof DiscoverSkillSchemas.organizationListItemVo>;
export type OrganizationListVo = z.infer<typeof DiscoverSkillSchemas.organizationListVo>;
export type ImportDiscoverSkillsVo = z.infer<typeof DiscoverSkillSchemas.importVo>;
export type ReportDiscoverSkillVo = z.infer<typeof DiscoverSkillSchemas.reportVo>;
