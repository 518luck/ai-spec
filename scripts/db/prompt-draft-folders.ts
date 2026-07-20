import "dotenv/config";

import { FOLDER_PRESET_COLORS } from "@/features/folder-combobox/config/folder-colors";
import prisma from "@/shared/db";

// 模拟当前用户（luck2 zhang / zhangluck598@gmail.com）在数据库中的 ID
const OWNER_ID = "cmrjdu92f0001099de7h2zu5p";

// 草稿文件夹归属的资源类型（与 Folder.resourceType 取值一致，仅组织草稿）
const RESOURCE_TYPE = "promptDraft";

// 文件夹模板：覆盖常见草稿分类，名称 + 描述成对出现，便于测试列表卡片展示效果
const folderTemplates = [
	{ name: "未完成草稿", description: "还在打磨、暂未达到收录标准的草稿" },
	{ name: "灵感速记", description: "随手记下的片段，等待整理" },
	{ name: "工作场景", description: "与日常工作流程相关的提示词草稿" },
	{ name: "学习笔记", description: "学习过程中产生的提示词尝试" },
	{ name: "客户沟通", description: "对外沟通用的文案和话术草稿" },
	{ name: "周报月报", description: "汇报类内容草稿，等待填充数据" },
	{ name: "需求文档", description: "需求评审前的初稿和讨论记录" },
	{ name: "技术方案", description: "架构与方案类草稿，待评审" },
	{ name: "复盘总结", description: "项目结束后的复盘草稿" },
	{ name: "归档暂存", description: "暂时不确定如何归类的内容" },
	{ name: "待二次加工", description: "AI 生成后需要人工润色的初稿" },
	{ name: "边界场景测试", description: "超长名称、特殊字符、emoji 等场景" },
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

// 主流程：先清空当前用户在 promptDraft 资源下的全部文件夹，再批量写入
const main = async (): Promise<void> => {
	const deleted = await prisma.folder.deleteMany({
		where: { ownerId: OWNER_ID, resourceType: RESOURCE_TYPE },
	});

	const folders = folderTemplates.map((_, index) => generateFolder(index));

	const result = await prisma.folder.createMany({
		data: folders,
	});

	// biome-ignore lint/suspicious/noConsole: seed 脚本需要向终端反馈执行结果
	console.log(`已清理 ${deleted.count} 个旧草稿文件夹，成功写入 ${result.count} 个新草稿文件夹`);
};

main()
	.catch((error: unknown) => {
		console.error("填充草稿文件夹失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
