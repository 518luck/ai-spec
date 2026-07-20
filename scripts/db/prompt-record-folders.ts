import "dotenv/config";

import { FOLDER_PRESET_COLORS } from "@/features/folder-combobox/config/folder-colors";
import prisma from "@/shared/db";

// 模拟当前用户（luck2 zhang / zhangluck598@gmail.com）在数据库中的 ID
const OWNER_ID = "cmrjdu92f0001099de7h2zu5p";

// 收录文件夹归属的资源类型（与 Folder.resourceType 取值一致，仅组织收录）
const RESOURCE_TYPE = "promptRecord";

// 文件夹模板：覆盖常见收录分类，名称 + 描述成对出现，便于测试列表卡片展示效果
const folderTemplates = [
	{ name: "常用提示词", description: "高频使用、已验证可用的收录集合" },
	{ name: "写作助手", description: "文案撰写、润色、改写相关提示词" },
	{ name: "代码生成", description: "代码生成、补全、重构相关提示词" },
	{ name: "代码审查", description: "PR Review、规范检查相关提示词" },
	{ name: "测试用例", description: "单元测试、集成测试用例生成提示词" },
	{ name: "产品需求", description: "需求拆解、用户故事撰写相关提示词" },
	{ name: "文档总结", description: "摘要、总结、提取要点类提示词" },
	{ name: "翻译润色", description: "多语言翻译与文字润色提示词" },
	{ name: "数据分析", description: "SQL、指标拆解、报告类提示词" },
	{ name: "营销文案", description: "推广、活动、广告投放文案提示词" },
	{ name: "角色扮演", description: "场景化角色扮演类提示词" },
	{ name: "学习辅导", description: "知识讲解、答疑类学习提示词" },
];

// 生成单个文件夹：颜色按索引在预设色盘上循环，sortOrder 递增便于验证拖拽排序
const generateFolder = (index: number) => {
	const template = folderTemplates[index];
	const baseDate = new Date(2026, 6, 10, 9, 0, 0, 0);
	return {
		name: template.name,
		description: template.description,
		color: FOLDER_PRESET_COLORS[index % FOLDER_PRESET_COLORS.length],
		resourceType: RESOURCE_TYPE,
		sortOrder: index,
		teamId: null,
		ownerId: OWNER_ID,
		createdAt: new Date(baseDate.getTime() + index * 60 * 1000),
	};
};

// 主流程：先清空当前用户在 promptRecord 资源下的全部文件夹，再批量写入
const main = async (): Promise<void> => {
	const deleted = await prisma.folder.deleteMany({
		where: { ownerId: OWNER_ID, resourceType: RESOURCE_TYPE },
	});

	const folders = folderTemplates.map((_, index) => generateFolder(index));

	const result = await prisma.folder.createMany({
		data: folders,
	});

	// biome-ignore lint/suspicious/noConsole: seed 脚本需要向终端反馈执行结果
	console.log(`已清理 ${deleted.count} 个旧收录文件夹，成功写入 ${result.count} 个新收录文件夹`);
};

main()
	.catch((error: unknown) => {
		console.error("填充收录文件夹失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
