// # 项目模板定义：纯前端占位，含展示信息与文件结构预览（文件编排），不提交后端

// 模板文件树节点：文件夹可含子节点，文件为叶子
export type TemplateFileNode = {
	name: string;
	type: "folder" | "file";
	children?: TemplateFileNode[];
};

// 项目模板：展示名 + 描述 + 文件编排
export type ProjectTemplate = {
	key: string;
	name: string;
	desc: string;
	tree: TemplateFileNode[];
};

// @ 模板占位列表：纯 UI 选择，不提交后端、不生成初始文档
export const PROJECT_TEMPLATES: readonly ProjectTemplate[] = [
	{
		key: "blank",
		name: "空白项目",
		desc: "从零开始搭建",
		tree: [{ name: "AGENTS.md", type: "file" }],
	},
	{
		key: "nextjs",
		name: "Next.js",
		desc: "全栈 React 框架",
		tree: [
			{
				name: "app",
				type: "folder",
				children: [
					{ name: "layout.tsx", type: "file" },
					{ name: "page.tsx", type: "file" },
					{ name: "api", type: "folder", children: [] },
				],
			},
			{
				name: "src",
				type: "folder",
				children: [
					{ name: "shared", type: "folder", children: [] },
					{ name: "widgets", type: "folder", children: [] },
				],
			},
			{ name: "public", type: "folder", children: [] },
			{ name: "AGENTS.md", type: "file" },
			{ name: "package.json", type: "file" },
		],
	},
	{
		key: "api",
		name: "API 服务",
		desc: "后端接口服务",
		tree: [
			{
				name: "src",
				type: "folder",
				children: [
					{
						name: "server",
						type: "folder",
						children: [
							{ name: "routes", type: "folder", children: [] },
							{ name: "middleware", type: "folder", children: [] },
						],
					},
					{ name: "config", type: "folder", children: [] },
				],
			},
			{ name: "AGENTS.md", type: "file" },
			{ name: "package.json", type: "file" },
		],
	},
	{
		key: "monorepo",
		name: "Monorepo",
		desc: "多包仓库结构",
		tree: [
			{
				name: "packages",
				type: "folder",
				children: [
					{ name: "ui", type: "folder", children: [] },
					{ name: "api", type: "folder", children: [] },
					{ name: "shared", type: "folder", children: [] },
				],
			},
			{
				name: "apps",
				type: "folder",
				children: [
					{ name: "web", type: "folder", children: [] },
					{ name: "admin", type: "folder", children: [] },
				],
			},
			{ name: "AGENTS.md", type: "file" },
			{ name: "package.json", type: "file" },
			{ name: "turbo.json", type: "file" },
		],
	},
];
