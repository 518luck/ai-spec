import "dotenv/config";

import prisma from "@/shared/db";

import { allTagTemplates, TAG_NAMES } from "./config/tags";
import { OWNER_ID, RESOURCE_TYPE, TAG_COLORS, TAG_COUNT } from "./utils/constants";
import { assertEqual, logOk, logSection, makeDate } from "./utils/helpers";

// # 标签填充脚本：建 24 个测试标签（12 业务 + 12 边缘），验证数量与名称长度边界

// 边缘标签名称的目标长度（正好 32 字符上限）
const EDGE_TAG_TARGET = 32;

const main = async (): Promise<void> => {
	logSection("清理旧测试规约标签");

	// 仅清理 rules 资源类型的标签，不影响 promptRecord 标签
	const deleted = await prisma.tag.deleteMany({
		where: { ownerId: OWNER_ID, resourceType: RESOURCE_TYPE },
	});
	console.log(`  · 已清理 ${deleted.count} 个旧测试标签`);

	logSection("写入测试标签");

	const tags = allTagTemplates.map((template, index) => ({
		name: template.name,
		color: TAG_COLORS[index % TAG_COLORS.length],
		resourceType: RESOURCE_TYPE,
		ownerId: OWNER_ID,
		teamId: null,
		createdAt: makeDate(index, 10),
	}));

	await prisma.tag.createMany({ data: tags, skipDuplicates: true });

	logOk(`写入 ${TAG_COUNT} 个测试标签`);

	logSection("断言验证");

	// 数量验证
	const count = await prisma.tag.count({
		where: { ownerId: OWNER_ID, resourceType: RESOURCE_TYPE },
	});
	assertEqual({ actual: count, expected: TAG_COUNT, label: "标签数量" });

	// 边缘标签名称长度验证：正好 32 字符
	const allTags = await prisma.tag.findMany({
		where: { ownerId: OWNER_ID, resourceType: RESOURCE_TYPE },
		select: { name: true },
	});
	const edgeTag = allTags.find((t) => t.name.length === EDGE_TAG_TARGET);
	if (!edgeTag) {
		throw new Error(`断言失败：未找到名称长度为 ${EDGE_TAG_TARGET} 的边缘标签`);
	}
	logOk(`边缘标签名称长度: ${edgeTag.name.length}（目标 ${EDGE_TAG_TARGET}）`);

	// 所有标签名称均 ≤ 32 字符
	for (const t of allTags) {
		if (t.name.length > 32) {
			throw new Error(`断言失败：标签「${t.name}」长度 ${t.name.length} 超过 32`);
		}
	}
	logOk("所有标签名称均 ≤ 32 字符");

	// 标签名称清单完整性验证
	const dbNames = new Set(allTags.map((t) => t.name));
	for (const name of TAG_NAMES) {
		if (!dbNames.has(name)) {
			throw new Error(`断言失败：标签「${name}」未写入数据库`);
		}
	}
	logOk(`标签名称清单完整（${TAG_NAMES.length} 个全部命中）`);
};

main()
	.catch((error: unknown) => {
		console.error("填充测试标签失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
