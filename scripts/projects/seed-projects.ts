// # 临时 seed：把前端 mock-tree.ts 的演示数据导入 Project/AgentsMd 表，供只读 MVP 验证
// > 一次性脚本，数据导入成功、前端验证无误后可删除本文件
// > 用法：
// >   pnpm seed:projects                  用库中第一个用户作为 owner
// >   pnpm exec tsx scripts/projects/seed-projects.ts --userId=xxx   指定 owner

import "dotenv/config";
// ! 必须先于业务模块加载：业务模块顶层间接 import axiom，依赖 globalThis.AsyncLocalStorage
import "../../workers/queue/worker-globals";

import prisma from "@/shared/db";

// @ seed 数据：从原 mock-tree.ts 搬运的 3 个项目及其 AGENTS.md 文档

// 单个项目的全部 AGENTS.md 文档（path → content）
type Docs = Record<string, string>;

// 项目 seed 数据：name/description/folderName/folderColor/docs
type ProjectSeed = {
	name: string;
	description: string;
	folderName: string;
	folderColor: string;
	docs: Docs;
};

const PROJECT_SEEDS: ProjectSeed[] = [
	{
		name: "ai-spec",
		description: "AI 规约管理平台，Next.js 全栈项目",
		folderName: "工作项目",
		folderColor: "#3b82f6",
		docs: {
			"AGENTS.md": [
				"# AI 代理开发指南",
				"",
				"项目总览与通用代码规范。",
				"",
				"- 前端业务代码在 `src/`",
				"- 后端入口在 `app/api/`",
				"- 数据库 schema 在 `prisma/`",
			].join("\n"),
			"app/AGENTS.md": [
				"# Next.js 路由层",
				"",
				"除 `app/api` 外应保持薄层，业务实现委托给 `src/`。",
			].join("\n"),
			"app/api/AGENTS.md": [
				"# 后端",
				"",
				"API 端点及服务端处理逻辑均在此，遵循后端开发模式与安全指南。",
			].join("\n"),
			"prisma/AGENTS.md": [
				"# 数据库",
				"",
				"Prisma schema 命名、字段排列顺序、删除策略与旧表迁移规范。",
			].join("\n"),
			"src/AGENTS.md": ["# 前端", "", "前端开发模式、设计系统指南和 React 测试最佳实践。"].join(
				"\n",
			),
		},
	},
	{
		name: "nova-blog",
		description: "个人博客，Astro + MDX 内容站",
		folderName: "个人项目",
		folderColor: "#10b981",
		docs: {
			"AGENTS.md": ["# 博客总览", "", "内容驱动的静态站点，文章一律使用 MDX 编写。"].join("\n"),
			"web/AGENTS.md": [
				"# 前台站点",
				"",
				"Astro 组件与主题样式约定，优先使用内容集合查询文章。",
			].join("\n"),
		},
	},
	{
		name: "iot-console",
		description: "物联网设备控制台，嵌入式 + Web 混合仓库",
		folderName: "学习实验",
		folderColor: "#f59e0b",
		docs: {
			"AGENTS.md": ["# 控制台总览", "", "设备接入、固件分发与远程运维的统一入口。"].join("\n"),
			"firmware/AGENTS.md": [
				"# 固件",
				"",
				"固件构建与 OTA 升级流程约定，版本号遵循语义化规范。",
			].join("\n"),
			"firmware/drivers/AGENTS.md": [
				"# 驱动层",
				"",
				"外设驱动的目录组织与寄存器访问封装规范。",
			].join("\n"),
		},
	},
];

// 从命令行参数解析 --userId
const parseUserId = (): string | undefined => {
	const match = process.argv.find((arg) => arg.startsWith("--userId="));
	return match?.slice("--userId=".length);
};

const seed = async (): Promise<void> => {
	const explicitUserId = parseUserId();
	// 取指定用户，否则回落到库中第一个用户
	const owner = explicitUserId
		? await prisma.user.findUnique({
				where: { id: explicitUserId },
				select: { id: true, email: true },
			})
		: await prisma.user.findFirst({ select: { id: true, email: true } });
	if (!owner) {
		console.error("❌ 找不到用户，请先注册一个账号，或通过 --userId=xxx 指定");
		process.exit(1);
	}

	console.warn(`👤 使用 owner: ${owner.email} (${owner.id})`);

	// 先确保该 owner 下的 3 个分组文件夹存在（按 name + owner 幂等）
	const folders = await Promise.all(
		PROJECT_SEEDS.map(async (seedItem) => {
			const existing = await prisma.folder.findFirst({
				where: { name: seedItem.folderName, ownerId: owner.id, teamId: null },
				select: { id: true },
			});
			if (existing) return { name: seedItem.folderName, id: existing.id };
			const created = await prisma.folder.create({
				data: {
					name: seedItem.folderName,
					color: seedItem.folderColor,
					resourceType: "project",
					ownerId: owner.id,
					teamId: null,
				},
				select: { id: true, name: true },
			});
			return { name: created.name, id: created.id };
		}),
	);

	// 逐个项目 upsert：按 (ownerId, name) 幂等，文件夹归属写在 project.folderId
	for (const [index, seedItem] of PROJECT_SEEDS.entries()) {
		const folderId = folders[index]?.id ?? null;

		// 项目按 (ownerId, name) 查找，存在则更新 description/folderId，不存在则新建
		const existingProject = await prisma.project.findFirst({
			where: { name: seedItem.name, ownerId: owner.id, teamId: null },
			select: { id: true },
		});
		const project = existingProject
			? await prisma.project.update({
					where: { id: existingProject.id },
					data: { description: seedItem.description, folderId },
					select: { id: true, name: true },
				})
			: await prisma.project.create({
					data: {
						name: seedItem.name,
						description: seedItem.description,
						folderId,
						ownerId: owner.id,
						teamId: null,
					},
					select: { id: true, name: true },
				});

		// 文档按 (projectId, path) upsert
		for (const [path, content] of Object.entries(seedItem.docs)) {
			await prisma.agentsMd.upsert({
				where: { projectId_path: { projectId: project.id, path } },
				create: { path, content, ownerId: owner.id, projectId: project.id },
				update: { content },
			});
		}
		console.warn(`✅ 项目「${project.name}」已导入（${Object.keys(seedItem.docs).length} 篇文档）`);
	}

	console.warn("\n🎉 seed 完成。数据已导入，前端验证无误后可删除 scripts/seed-projects.ts");
};

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("❌ seed 失败:", err instanceof Error ? err.message : String(err));
		process.exit(1);
	});
