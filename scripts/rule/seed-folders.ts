import "dotenv/config";

import prisma from "@/shared/db";

import { allFolderTemplates } from "./config/folders";
import { EDGE_SPACE_32_NAME, SPACE_NAMES } from "./config/spaces";
import { FOLDER_COLORS, FOLDER_COUNT, OWNER_ID, RESOURCE_TYPE } from "./utils/constants";
import { assertEqual, logOk, logSection, makeDate } from "./utils/helpers";

// # 文件夹填充脚本：按领域绑定建 20 个测试文件夹，验证 ruleSpaceId 绑定与描述长度边界

// 边缘文件夹描述的目标长度（正好 200 字符上限）
const EDGE_DESC_TARGET = 200;

const main = async (): Promise<void> => {
	logSection("查询测试领域 spaceId 映射");

	const spaces = await prisma.ruleSpace.findMany({
		where: { ownerId: OWNER_ID, name: { in: SPACE_NAMES } },
		select: { id: true, name: true },
	});
	const spaceIdByName = new Map(spaces.map((s) => [s.name, s.id]));

	// 校验所有模板引用的领域都存在
	for (const template of allFolderTemplates) {
		if (!spaceIdByName.has(template.spaceName)) {
			throw new Error(`领域「${template.spaceName}」不存在，请先运行 seed-spaces`);
		}
	}
	logOk(`已加载 ${spaceIdByName.size} 个领域的 spaceId`);

	logSection("清理旧测试规约文件夹");

	// 仅清理 rules 资源类型的文件夹，不影响 promptRecord/promptDraft 文件夹
	const deleted = await prisma.folder.deleteMany({
		where: { ownerId: OWNER_ID, resourceType: RESOURCE_TYPE },
	});
	console.log(`  · 已清理 ${deleted.count} 个旧测试文件夹`);

	logSection("写入测试文件夹");

	const folders = allFolderTemplates.map((template, index) => ({
		name: template.name,
		description: template.description,
		color: FOLDER_COLORS[index % FOLDER_COLORS.length],
		resourceType: RESOURCE_TYPE,
		sortOrder: index,
		teamId: null,
		ownerId: OWNER_ID,
		ruleSpaceId: spaceIdByName.get(template.spaceName) ?? null,
		createdAt: makeDate(index, 30),
	}));

	await prisma.folder.createMany({ data: folders });

	logOk(`写入 ${FOLDER_COUNT} 个测试文件夹`);

	logSection("断言验证");

	// 数量验证
	const count = await prisma.folder.count({
		where: { ownerId: OWNER_ID, resourceType: RESOURCE_TYPE },
	});
	assertEqual({ actual: count, expected: FOLDER_COUNT, label: "文件夹数量" });

	// 所有规约文件夹的 ruleSpaceId 必须非空（绑定验证）
	const allFolders = await prisma.folder.findMany({
		where: { ownerId: OWNER_ID, resourceType: RESOURCE_TYPE },
		select: { id: true, name: true, ruleSpaceId: true, description: true },
	});
	let nullSpaceCount = 0;
	for (const f of allFolders) {
		if (!f.ruleSpaceId) nullSpaceCount += 1;
	}
	assertEqual({ actual: nullSpaceCount, expected: 0, label: "未绑定领域的文件夹数（应为 0）" });

	// 边缘描述长度验证：存在正好 200 字符的描述（description 可空，用 ?? 0 兜底）
	const edgeFolder = allFolders.find((f) => (f.description?.length ?? 0) === EDGE_DESC_TARGET);
	if (!edgeFolder) {
		throw new Error(`断言失败：未找到描述长度为 ${EDGE_DESC_TARGET} 的边缘文件夹`);
	}
	logOk(`边缘文件夹描述长度: ${edgeFolder.description?.length ?? 0}（目标 ${EDGE_DESC_TARGET}）`);

	// 文件夹名称均 ≤ 32 字符
	for (const f of allFolders) {
		if (f.name.length > 32) {
			throw new Error(`断言失败：文件夹「${f.name}」长度 ${f.name.length} 超过 32`);
		}
	}
	logOk("所有文件夹名称均 ≤ 32 字符");

	// 确认边缘领域（32 字符名）下也有文件夹
	const edgeSpaceFolders = allFolders.filter(
		(f) => f.ruleSpaceId === spaceIdByName.get(EDGE_SPACE_32_NAME),
	);
	if (edgeSpaceFolders.length === 0) {
		throw new Error("断言失败：边缘领域下无文件夹");
	}
	logOk(`边缘领域下文件夹数: ${edgeSpaceFolders.length}`);
};

main()
	.catch((error: unknown) => {
		console.error("填充测试文件夹失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
