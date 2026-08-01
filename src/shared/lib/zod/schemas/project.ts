import { z } from "@/shared/lib/zod";

// # 项目（Project）相关 zod schema：项目列表/详情/新建 + 项目文档（AGENTS.md）列表/详情校验
// > schema 值分两个聚合对象：ProjectSchemas（项目）+ AgentsMdSchemas（项目文档），type 保留独立导出

// @ 拼装件（局部变量，供 Dto/Vo 组装用）
// 项目名：必填，1~64 字。refine 只校验纯空白，不改写用户输入
const name = z
	.string({ error: "请输入项目名称" })
	.refine((s) => s.trim().length > 0, { error: "请输入项目名称" })
	.max(64, { error: "名称长度不能超过 64 个字符" });

// 项目简介：可选，最多 200 字
const description = z
	.string()
	.trim()
	.max(200, { error: "简介长度不能超过 200 个字符" })
	.optional()
	.or(z.literal(""));

// 仓库地址：可选，必须是合法 URL（预留给将来的 git 同步）
const repoUrl = z
	.string()
	.trim()
	.url({ error: "仓库地址需为合法 URL" })
	.optional()
	.or(z.literal(""));

// 项目所属分组文件夹：null/空串表示未分类
const folderId = z.string().nullable().or(z.literal(""));

// @ 出参 Vo
// 项目列表项：卡片展示用，含文件夹归属信息与文档计数，不含资源计数（资源计数前端硬编码）
const projectListItemVo = z.object({
	id: z.string(),
	name: z.string(),
	description: description,
	folderId: z.string().nullable(),
	folderName: z.string().nullable(),
	folderColor: z.string().nullable(),
	docCount: z.number(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

// 项目详情：抽屉取数用，结构与列表项一致（MVP 不含资源清单）
const projectVo = z.object({
	id: z.string(),
	name: z.string(),
	description: description,
	folderId: z.string().nullable(),
	folderName: z.string().nullable(),
	folderColor: z.string().nullable(),
	docCount: z.number(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

// 项目文档列表项：卡片展示用，标题与摘要从 content 提取
const agentsMdListItemVo = z.object({
	id: z.string(),
	path: z.string(),
	title: z.string(),
	excerpt: z.string(),
});

// 项目文档详情：阅读态取全文用
const agentsMdContentVo = z.object({
	id: z.string(),
	path: z.string(),
	content: z.string(),
});

// @ 聚合对象：所有 schema 值按「拼装件 / 入参 Dto / 出参 Vo」分组
export const ProjectSchemas = {
	// @ 拼装件（也导出，消费侧可能单独用）
	name,
	description,
	repoUrl,
	folderId,

	// @ 入参 Dto
	// 新建项目入参：名称必填，描述与文件夹归属可选
	createDto: z.object({
		name,
		description,
		folderId,
	}),

	// 项目列表查询入参：文件夹筛选 + 搜索 + 分页
	listDto: z.object({
		folderId: z.string().optional(),
		q: z.string().optional(),
		page: z.coerce.number().int().min(1).optional(),
		pageSize: z.coerce.number().int().min(1).max(100).optional(),
	}),

	// @ 出参 Vo
	vo: projectVo,
	listItemVo: projectListItemVo,
	// 项目列表响应（分页元信息 + 数据）
	listVo: z.object({
		data: z.array(projectListItemVo),
		total: z.number(),
		hasMore: z.boolean(),
	}),
} as const;

// 项目文档聚合 schema：独立挂在 agentsMdsRouter 下，projectId 作为必传入参（原走 URL 路径，现走 query）
export const AgentsMdSchemas = {
	// @ 入参 Dto
	// 文档列表查询入参：projectId 必传（定位所属项目），folderPath 为可选的路径前缀筛选
	listDto: z.object({
		projectId: z.string(),
		folderPath: z.string().optional(),
	}),

	// @ 出参 Vo
	listItemVo: agentsMdListItemVo,
	// 文档列表响应：单项目文档量可控，不分页
	listVo: z.array(agentsMdListItemVo),
	contentVo: agentsMdContentVo,
} as const;

// @ 派生类型（保留独立导出，消费侧 import type）
export type CreateProjectDto = z.infer<typeof ProjectSchemas.createDto>;
export type ListProjectsDto = z.infer<typeof ProjectSchemas.listDto>;
export type ProjectVo = z.infer<typeof ProjectSchemas.vo>;
export type ProjectListItemVo = z.infer<typeof ProjectSchemas.listItemVo>;
export type ProjectListVo = z.infer<typeof ProjectSchemas.listVo>;

export type ListAgentsMdsDto = z.infer<typeof AgentsMdSchemas.listDto>;
export type AgentsMdListItemVo = z.infer<typeof AgentsMdSchemas.listItemVo>;
export type AgentsMdListVo = z.infer<typeof AgentsMdSchemas.listVo>;
export type AgentsMdContentVo = z.infer<typeof AgentsMdSchemas.contentVo>;
