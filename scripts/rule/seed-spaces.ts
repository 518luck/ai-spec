import "dotenv/config";

import prisma from "@/shared/db";

import { allSpaceTemplates, EDGE_SPACE_32_NAME, SPACE_NAMES } from "./config/spaces";
import { OWNER_ID, SPACE_COUNT } from "./utils/constants";
import { assertEqual, logOk, logSection, makeDate } from "./utils/helpers";

// # 领域空间填充脚本：建 8 个测试领域（6 业务 + 2 边缘），并验证数量与名称长度边界

const main = async (): Promise<void> => {
	logSection("清理旧测试领域");

	// 按名称清理：仅删测试领域，不影响现有个人默认空间「我的规约」
	// 级联删除其下文件夹与规则（RuleSpace onDelete: Cascade）
	const deleted = await prisma.ruleSpace.deleteMany({
		where: { ownerId: OWNER_ID, name: { in: SPACE_NAMES } },
	});
	console.log(`  · 已清理 ${deleted.count} 个旧测试领域`);

	logSection("写入测试领域");

	const spaces = allSpaceTemplates.map((template, index) => ({
		name: template.name,
		icon: template.icon,
		color: template.color,
		sortOrder: index,
		ownerId: OWNER_ID,
		teamId: null,
		createdAt: makeDate(index, 60),
	}));

	await prisma.ruleSpace.createMany({ data: spaces });

	logOk(`写入 ${SPACE_COUNT} 个测试领域`);

	logSection("断言验证");

	// 数量验证
	const count = await prisma.ruleSpace.count({
		where: { ownerId: OWNER_ID, name: { in: SPACE_NAMES } },
	});
	assertEqual({ actual: count, expected: SPACE_COUNT, label: "领域数量" });

	// 边缘领域名称长度验证：正好 32 字符
	const edgeSpace = await prisma.ruleSpace.findFirst({
		where: { ownerId: OWNER_ID, name: EDGE_SPACE_32_NAME },
		select: { name: true },
	});
	assertEqual({
		actual: edgeSpace?.name.length ?? 0,
		expected: 32,
		label: "边缘领域名称长度（32 字符上限）",
	});

	// 所有领域名称不超 32 字符
	const allSpaces = await prisma.ruleSpace.findMany({
		where: { ownerId: OWNER_ID, name: { in: SPACE_NAMES } },
		select: { name: true },
	});
	for (const s of allSpaces) {
		if (s.name.length > 32) {
			throw new Error(`断言失败：领域「${s.name}」长度 ${s.name.length} 超过 32`);
		}
	}
	logOk("所有领域名称均 ≤ 32 字符");
};

main()
	.catch((error: unknown) => {
		console.error("填充测试领域失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
