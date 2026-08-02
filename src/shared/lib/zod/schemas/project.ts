import { z } from "@/shared/lib/zod";

// # 项目（Project）相关 zod schema：项目列表/详情/新建 + 项目配置（AGENTS.md）与项目内文件夹校验
// > schema 值分三个聚合对象：ProjectSchemas（项目）+ AgentsMdSchemas（项目配置）+ ProjectFolderSchemas（项目内文件夹），type 保留独立导出

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

// 配置/文件夹名共用：不含路径分隔符（防止层级符号混入名字导致语义混乱）；表关联模型下名字独立成字段，允许空格
const segmentName = z
	.string({ error: "请输入名称" })
	.trim()
	.min(1, { error: "请输入名称" })
	.max(64, { error: "名称长度不能超过 64 个字符" })
	.refine((s) => !/[\\/]/.test(s), { error: "名称不能包含 / 或 \\" });

// @ 出参 Vo
// 项目列表项：卡片展示用，含文件夹归属信息与配置计数，不含资源计数（资源计数前端硬编码）
const projectListItemVo = z.object({
	id: z.string(),
	name: z.string(),
	description: description,
	folderId: z.string().nullable(),
	folderName: z.string().nullable(),
	folderColor: z.string().nullable(),
	agentsMdCount: z.number(),
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
	agentsMdCount: z.number(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

// 项目配置列表项：卡片展示用，标题直接用文件名 name，摘要从 content 提取；folderIds 为挂载的文件夹（多对多）
const agentsMdListItemVo = z.object({
	id: z.string(),
	name: z.string(),
	excerpt: z.string(),
	folderIds: z.array(z.string()),
});

// 搜索字段开关（与详情页搜索 UI 的字段选项对齐）：名字 / 内容；缺省时名字和内容都搜
const agentsMdSearchField = z.enum(["name", "content"]);

// 全项目搜索结果项：本项目列表项 + 项目归属（卡片底部标注所属项目名）
const agentsMdSearchVo = agentsMdListItemVo.extend({
	projectId: z.string(),
	projectName: z.string(),
});

// 项目配置详情：阅读态取全文用
const agentsMdContentVo = z.object({
	id: z.string(),
	name: z.string(),
	content: z.string(),
});

// 项目内文件夹列表项：树形结构，parentId 为父文件夹 id（null=项目根下）
const projectFolderListItemVo = z.object({
	id: z.string(),
	parentId: z.string().nullable(),
	name: z.string(),
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

// 项目配置聚合 schema：独立挂在 agentsMdsRouter 下，projectId 作为必传入参
export const AgentsMdSchemas = {
	// @ 拼装件（也导出，消费侧可能单独用）
	searchField: agentsMdSearchField,

	// @ 入参 Dto
	// 配置列表查询入参：projectId 必传（定位所属项目），folderId 为可选的文件夹筛选（直接挂载），
	// q/fields 为搜索参数（fields 缺省时名字和内容都搜）
	listDto: z.object({
		projectId: z.string(),
		folderId: z.string().optional(),
		q: z.string().optional(),
		fields: z.array(agentsMdSearchField).optional(),
	}),

	// 全项目搜索入参：q 必填（无关键词的全项目搜索无意义），fields 缺省时名字和内容都搜
	listAllDto: z.object({
		q: z.string(),
		fields: z.array(agentsMdSearchField).optional(),
	}),

	// 新建配置入参：folderId 必传（配置创建即挂载到该文件夹），name 默认 AGENTS.md 可改
	createDto: z.object({
		projectId: z.string(),
		folderId: z.string(),
		name: segmentName,
	}),

	// @ 出参 Vo
	listItemVo: agentsMdListItemVo,
	// 配置列表响应：单项目配置量可控，不分页
	listVo: z.array(agentsMdListItemVo),
	contentVo: agentsMdContentVo,
	// 全项目搜索结果项与响应
	searchVo: agentsMdSearchVo,
	listAllVo: z.array(agentsMdSearchVo),
} as const;

// 项目内文件夹聚合 schema：独立挂在 projectFoldersRouter 下，projectId 作为必传入参
export const ProjectFolderSchemas = {
	// @ 入参 Dto
	// 文件夹列表查询入参：projectId 必传（定位所属项目）
	listDto: z.object({
		projectId: z.string(),
	}),

	// 新建文件夹入参：parentId 为父文件夹 id（缺省=项目根文件夹下），name 为文件夹名
	createDto: z.object({
		projectId: z.string(),
		parentId: z.string().optional(),
		name: segmentName,
	}),

	// @ 出参 Vo
	listItemVo: projectFolderListItemVo,
	// 文件夹列表响应：单项目文件夹量可控，不分页
	listVo: z.array(projectFolderListItemVo),
} as const;

// @ 派生类型（保留独立导出，消费侧 import type）
export type CreateProjectDto = z.infer<typeof ProjectSchemas.createDto>;
export type ListProjectsDto = z.infer<typeof ProjectSchemas.listDto>;
export type ProjectVo = z.infer<typeof ProjectSchemas.vo>;
export type ProjectListItemVo = z.infer<typeof ProjectSchemas.listItemVo>;
export type ProjectListVo = z.infer<typeof ProjectSchemas.listVo>;

export type ListAgentsMdsDto = z.infer<typeof AgentsMdSchemas.listDto>;
export type CreateAgentsMdDto = z.infer<typeof AgentsMdSchemas.createDto>;
export type AgentsMdListItemVo = z.infer<typeof AgentsMdSchemas.listItemVo>;
export type AgentsMdListVo = z.infer<typeof AgentsMdSchemas.listVo>;
export type AgentsMdContentVo = z.infer<typeof AgentsMdSchemas.contentVo>;
export type AgentsMdSearchFieldKey = z.infer<typeof AgentsMdSchemas.searchField>;
export type ListAllAgentsMdsDto = z.infer<typeof AgentsMdSchemas.listAllDto>;
export type AgentsMdSearchVo = z.infer<typeof AgentsMdSchemas.searchVo>;
export type AgentsMdSearchListVo = z.infer<typeof AgentsMdSchemas.listAllVo>;

export type ListProjectFoldersDto = z.infer<typeof ProjectFolderSchemas.listDto>;
export type CreateProjectFolderDto = z.infer<typeof ProjectFolderSchemas.createDto>;
export type ProjectFolderListItemVo = z.infer<typeof ProjectFolderSchemas.listItemVo>;
export type ProjectFolderListVo = z.infer<typeof ProjectFolderSchemas.listVo>;
