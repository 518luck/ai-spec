// # AGENTS.md 文件树演示数据：以路径作 itemId 的扁平结构，供 headless-tree 的同步 dataLoader 读取

/** 树节点：文件夹有 children（子节点 id 列表），文件有 content（markdown 源文本），项目节点另有简介 */
export interface AgentsTreeItem {
	name: string;
	description?: string;
	children?: string[];
	content?: string;
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

/** 项目卡片条目：首页项目列表展示用 */
export interface ProjectEntry {
	projectId: string;
	name: string;
	description: string;
	docCount: number;
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

/** 收集根节点下的全部项目，附带各自的 AGENTS.md 数量，供首页项目卡片展示 */
export const collectProjects = (): ProjectEntry[] =>
	(agentsTreeItems[AGENTS_TREE_ROOT_ID]?.children ?? []).map((projectId) => {
		const project = agentsTreeItems[projectId];
		return {
			projectId,
			name: project?.name ?? projectId,
			description: project?.description ?? "",
			docCount: collectAgentsDocs(projectId).length,
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
