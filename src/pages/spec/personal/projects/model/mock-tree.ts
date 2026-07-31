// # AGENTS.md 文件树演示数据：以路径作 itemId 的扁平结构，供 headless-tree 的同步 dataLoader 读取

import type { SearchFilters } from "@/shared/lib/search-filter-codec";

/** 树节点：文件夹有 children（子节点 id 列表），文件有 content（markdown 源文本），项目根节点另有简介与文件夹归属 */
export interface AgentsTreeItem {
	name: string;
	description?: string;
	children?: string[];
	content?: string;
	folderId?: string | null;
}

/** 虚拟根节点 id：其 children 即项目列表，headless-tree 从它向下取子节点，根本身不渲染 */
export const AGENTS_TREE_ROOT_ID = "root";

// > 父节点通过 children 引用子节点 id；children 内文件夹排前、文件排后，模拟 VSCode 资源管理器的排序
export const agentsTreeItems: Record<string, AgentsTreeItem> = {
	[AGENTS_TREE_ROOT_ID]: { name: "root", children: ["ai-spec", "nova-blog", "iot-console"] },

	// @ 项目：ai-spec
	"ai-spec": {
		name: "ai-spec",
		description: "AI 规约管理平台，Next.js 全栈项目",
		folderId: "folder-work",
		children: ["ai-spec/app", "ai-spec/prisma", "ai-spec/src", "ai-spec/AGENTS.md"],
	},
	"ai-spec/app": {
		name: "app",
		children: ["ai-spec/app/api", "ai-spec/app/AGENTS.md"],
	},
	"ai-spec/app/api": {
		name: "api",
		children: ["ai-spec/app/api/AGENTS.md"],
	},
	"ai-spec/prisma": {
		name: "prisma",
		children: ["ai-spec/prisma/AGENTS.md"],
	},
	"ai-spec/src": {
		name: "src",
		children: ["ai-spec/src/AGENTS.md"],
	},
	"ai-spec/AGENTS.md": {
		name: "AGENTS.md",
		content: [
			"# AI 代理开发指南",
			"",
			"项目总览与通用代码规范。",
			"",
			"- 前端业务代码在 `src/`",
			"- 后端入口在 `app/api/`",
			"- 数据库 schema 在 `prisma/`",
		].join("\n"),
	},
	"ai-spec/app/AGENTS.md": {
		name: "AGENTS.md",
		content: ["# Next.js 路由层", "", "除 `app/api` 外应保持薄层，业务实现委托给 `src/`。"].join(
			"\n",
		),
	},
	"ai-spec/app/api/AGENTS.md": {
		name: "AGENTS.md",
		content: ["# 后端", "", "API 端点及服务端处理逻辑均在此，遵循后端开发模式与安全指南。"].join(
			"\n",
		),
	},
	"ai-spec/prisma/AGENTS.md": {
		name: "AGENTS.md",
		content: ["# 数据库", "", "Prisma schema 命名、字段排列顺序、删除策略与旧表迁移规范。"].join(
			"\n",
		),
	},
	"ai-spec/src/AGENTS.md": {
		name: "AGENTS.md",
		content: ["# 前端", "", "前端开发模式、设计系统指南和 React 测试最佳实践。"].join("\n"),
	},

	// @ 项目：nova-blog
	"nova-blog": {
		name: "nova-blog",
		description: "个人博客，Astro + MDX 内容站",
		folderId: "folder-personal",
		children: ["nova-blog/web", "nova-blog/AGENTS.md"],
	},
	"nova-blog/web": {
		name: "web",
		children: ["nova-blog/web/AGENTS.md"],
	},
	"nova-blog/AGENTS.md": {
		name: "AGENTS.md",
		content: ["# 博客总览", "", "内容驱动的静态站点，文章一律使用 MDX 编写。"].join("\n"),
	},
	"nova-blog/web/AGENTS.md": {
		name: "AGENTS.md",
		content: ["# 前台站点", "", "Astro 组件与主题样式约定，优先使用内容集合查询文章。"].join("\n"),
	},

	// @ 项目：iot-console
	"iot-console": {
		name: "iot-console",
		description: "物联网设备控制台，嵌入式 + Web 混合仓库",
		folderId: "folder-learning",
		children: ["iot-console/firmware", "iot-console/AGENTS.md"],
	},
	"iot-console/firmware": {
		name: "firmware",
		children: ["iot-console/firmware/drivers", "iot-console/firmware/AGENTS.md"],
	},
	"iot-console/firmware/drivers": {
		name: "drivers",
		children: ["iot-console/firmware/drivers/AGENTS.md"],
	},
	"iot-console/AGENTS.md": {
		name: "AGENTS.md",
		content: ["# 控制台总览", "", "设备接入、固件分发与远程运维的统一入口。"].join("\n"),
	},
	"iot-console/firmware/AGENTS.md": {
		name: "AGENTS.md",
		content: ["# 固件", "", "固件构建与 OTA 升级流程约定，版本号遵循语义化规范。"].join("\n"),
	},
	"iot-console/firmware/drivers/AGENTS.md": {
		name: "AGENTS.md",
		content: ["# 驱动层", "", "外设驱动的目录组织与寄存器访问封装规范。"].join("\n"),
	},
};

// @ 树数据读取辅助

/** 卡片列表用的文档条目：文档 id + 所在文件夹路径 + 从内容提取的标题与摘要 */
export interface AgentsDocEntry {
	fileId: string;
	folderPath: string;
	title: string;
	excerpt: string;
}

/** 各类 AI 资源计数，供卡片徽章展示 */
export interface ResourceCount {
	skill: number;
	plugin: number;
	mcp: number;
	agent: number;
}

/** 项目卡片条目：首页项目列表展示用 */
export interface ProjectEntry {
	projectId: string;
	name: string;
	description: string;
	folderId: string | null;
	docCount: number;
	resourceCount: ResourceCount;
}

/** 把路径型 id 拆成累计前缀，如 "a/b/c" → ["a", "a/b", "a/b/c"]；供面包屑分段与祖先展开使用 */
export const getPathIds = (pathId: string): string[] => {
	const parts = pathId.split("/");
	return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
};

/** 取某节点下的子文件夹 id（过滤掉文件）；左侧树只渲染文件夹 */
export const getSubfolderIds = (itemId: string): string[] =>
	(agentsTreeItems[itemId]?.children ?? []).filter((childId) =>
		Boolean(agentsTreeItems[childId]?.children),
	);

/** 递归收集某文件夹子树内的全部 AGENTS.md 文档，供右侧卡片列表展示 */
export const collectAgentsDocs = (folderId: string): AgentsDocEntry[] => {
	const { children = [] } = agentsTreeItems[folderId] ?? {};
	return children.flatMap((childId) => {
		const child = agentsTreeItems[childId];
		if (!child) return [];
		if (child.children) return collectAgentsDocs(childId);
		return [makeDocEntry(childId)];
	});
};

/** 收集根节点下的全部项目，附带各自的 AGENTS.md 数量与资源计数，供首页项目卡片展示 */
export const collectProjects = (): ProjectEntry[] =>
	(agentsTreeItems[AGENTS_TREE_ROOT_ID]?.children ?? []).map((projectId) => {
		const project = agentsTreeItems[projectId];
		const resources = mockProjectResources[projectId] ?? [];
		return {
			projectId,
			name: project?.name ?? projectId,
			description: project?.description ?? "",
			folderId: project?.folderId ?? null,
			docCount: collectAgentsDocs(projectId).length,
			resourceCount: countResources(resources),
		};
	});

// 从文档内容提取标题（首个 # 行）与摘要（首个非标题正文行）；文件夹路径由文件 id 去掉末段得出
const makeDocEntry = (fileId: string): AgentsDocEntry => {
	const lines = (agentsTreeItems[fileId]?.content ?? "").split("\n");
	const title = lines.find((line) => line.startsWith("# "))?.slice(2) || "AGENTS.md";
	const excerpt = lines.find((line) => line.trim() && !line.startsWith("#")) || "";
	return {
		fileId,
		folderPath: fileId.replace(/\/[^/]+$/, ""),
		title,
		excerpt,
	};
};

// @ AI 资源与文件夹 mock 数据

/** AI 资源类型枚举 */
export type AiResourceType = "skill" | "plugin" | "mcp" | "agent";

/** 单条 AI 资源：项目收录的 skill / 插件 / MCP / agent 等条目 */
export interface AiResourceItem {
	id: string;
	name: string;
	type: AiResourceType;
	description: string;
	source?: string;
}

/** mock 文件夹：供列表筛选与抽屉 badge 展示 */
export interface MockFolder {
	id: string;
	name: string;
	color: string;
}

/** 项目预览汇总：抽屉取数用，聚合资源清单与文档列表 */
export interface ProjectPreview {
	name: string;
	description: string;
	folderId: string | null;
	resources: AiResourceItem[];
	agentsDocs: AgentsDocEntry[];
}

// > mock 文件夹列表（项目归属用）
export const mockFolders: MockFolder[] = [
	{ id: "folder-work", name: "工作项目", color: "#3b82f6" },
	{ id: "folder-personal", name: "个人项目", color: "#10b981" },
	{ id: "folder-learning", name: "学习实验", color: "#f59e0b" },
];

// > 各项目收录的 AI 资源清单（mock）
export const mockProjectResources: Record<string, AiResourceItem[]> = {
	"ai-spec": [
		{
			id: "r1",
			name: "spec-reviewer",
			type: "skill",
			description: "审查代码是否符合 AGENTS.md 规约",
			source: "ai-spec/skills",
		},
		{
			id: "r2",
			name: "git-save",
			type: "skill",
			description: "快速提交本地变更",
			source: "ai-spec/skills",
		},
		{
			id: "r3",
			name: "zcode-plugins-official",
			type: "plugin",
			description: "官方插件合集",
			source: "zcode/plugins",
		},
		{
			id: "r4",
			name: "document-skills",
			type: "plugin",
			description: "DOCX / PDF 文档处理",
			source: "zcode/plugins",
		},
		{
			id: "r5",
			name: "context7",
			type: "mcp",
			description: "库文档检索与代码示例",
			source: "upstash/context7",
		},
		{
			id: "r6",
			name: "browser-use",
			type: "mcp",
			description: "浏览器自动化与页面测试",
			source: "browser-use/mcp",
		},
		{
			id: "r7",
			name: "trellis-check",
			type: "agent",
			description: "质量校验与 spec 合规",
			source: "ai-spec/.trellis",
		},
		{
			id: "r8",
			name: "trellis-brainstorm",
			type: "agent",
			description: "需求梳理与 PRD 收敛",
			source: "ai-spec/.trellis",
		},
	],
	"nova-blog": [
		{
			id: "r9",
			name: "mermaid-diagram",
			type: "skill",
			description: "用 Mermaid 解释代码与业务逻辑",
			source: "nova-blog/skills",
		},
		{
			id: "r10",
			name: "english-to-chinese",
			type: "skill",
			description: "英文文本翻译为简体中文",
			source: "nova-blog/skills",
		},
		{
			id: "r11",
			name: "rss-feed",
			type: "plugin",
			description: "RSS 订阅与自动摘要",
			source: "nova-blog/plugins",
		},
		{
			id: "r12",
			name: "web-search",
			type: "mcp",
			description: "网页搜索与摘要抓取",
			source: "web-search/mcp",
		},
		{
			id: "r13",
			name: "content-curator",
			type: "agent",
			description: "内容策展与发布编排",
			source: "nova-blog/.agents",
		},
	],
	"iot-console": [
		{
			id: "r14",
			name: "weekly-report",
			type: "skill",
			description: "根据 Git 提交生成中文周报",
			source: "iot-console/skills",
		},
		{
			id: "r15",
			name: "device-simulator",
			type: "plugin",
			description: "设备协议模拟与压测",
			source: "iot-console/plugins",
		},
		{
			id: "r16",
			name: "mqtt-bridge",
			type: "mcp",
			description: "MQTT 消息桥接与调试",
			source: "iot-console/mcp",
		},
		{
			id: "r17",
			name: "ota-orchestrator",
			type: "agent",
			description: "固件 OTA 升级编排",
			source: "iot-console/.agents",
		},
	],
};

// @ 资源与文件夹读取 helper

/** 统计资源列表中各类型数量 */
const countResources = (resources: AiResourceItem[]): ResourceCount => {
	const count: ResourceCount = { skill: 0, plugin: 0, mcp: 0, agent: 0 };
	for (const r of resources) count[r.type] += 1;
	return count;
};

/** 取全部文件夹，供筛选下拉渲染 */
export const collectFolders = (): MockFolder[] => mockFolders;

/** 按 id 取文件夹，找不到返回 null */
export const getFolder = (folderId: string | null): MockFolder | null =>
	folderId ? (mockFolders.find((f) => f.id === folderId) ?? null) : null;

/** 取某项目的预览数据（资源 + 文档），供预览抽屉展示 */
export const getProjectPreview = (projectId: string): ProjectPreview => {
	const project = agentsTreeItems[projectId];
	return {
		name: project?.name ?? projectId,
		description: project?.description ?? "",
		folderId: project?.folderId ?? null,
		resources: mockProjectResources[projectId] ?? [],
		agentsDocs: collectAgentsDocs(projectId),
	};
};

/**
 * 按文件夹与搜索词过滤项目，供列表页筛选。
 * filter 字段开关对齐搜索框：title→name、description→description，激活字段间 OR；都没激活时不参与搜索。
 */
export const filterProjects = ({
	folderId,
	q,
	filter,
}: {
	folderId: string | null;
	q?: string;
	filter: SearchFilters;
}): ProjectEntry[] => {
	const query = q?.trim().toLowerCase() ?? "";
	const searchTitle = filter.title === true;
	const searchDescription = filter.description === true;
	return collectProjects().filter((p) => {
		// folderId 为 null 表示"全部"，不按文件夹筛
		if (folderId && p.folderId !== folderId) return false;
		// 无搜索词或未激活任何字段时不参与搜索，保留该条目
		if (!query || (!searchTitle && !searchDescription)) return true;
		const matchTitle = searchTitle && p.name.toLowerCase().includes(query);
		const matchDesc = searchDescription && p.description.toLowerCase().includes(query);
		return matchTitle || matchDesc;
	});
};
