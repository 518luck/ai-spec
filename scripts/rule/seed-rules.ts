import "dotenv/config";

import prisma from "@/shared/db";
import { edgeRuleTemplates, type RuleTemplate, ruleTemplates } from "./config/rule-templates";
import { SPACE_NAMES } from "./config/spaces";
import { TAG_NAMES } from "./config/tags";
import { LONG_CONTENT_BUILDERS, LONG_CONTENT_NAMES } from "./content/long-content";
import { LONG_CONTENT_COUNT, OWNER_ID, RULE_COUNT } from "./utils/constants";
import {
	assertEqual,
	assertRange,
	assertTrue,
	logInfo,
	logOk,
	logSection,
	makeDate,
	randomInt,
} from "./utils/helpers";

// # 规则填充脚本（核心）：建 120 条规则，绑定领域+文件夹，联动标签，含超长正文与全面断言

// 业务规则生成数量：12 模板循环填充至 95 条
const BUSINESS_RULE_COUNT = 95;
// 超长正文规则数量（5 个主题各 1 条）
// 边缘规则数量：10 个边缘模板
const EDGE_RULE_COUNT = edgeRuleTemplates.length;
// 补充规则数量：填满至 RULE_COUNT
// 计算式：BUSINESS_RULE_COUNT + LONG_CONTENT_COUNT + EDGE_RULE_COUNT + 补充 = RULE_COUNT
const FILLER_RULE_COUNT = RULE_COUNT - BUSINESS_RULE_COUNT - LONG_CONTENT_COUNT - EDGE_RULE_COUNT;

// 超长正文字符数校验区间
const LONG_CONTENT_MIN = 30000;
const LONG_CONTENT_MAX = 45000;

// 单条规则的可写入数据结构（createMany 标量字段）
type RuleCreateData = {
	name: string;
	content: string;
	ownerId: string;
	spaceId: string;
	folderId: string | null;
	createdAt: Date;
	updatedAt: Date;
};

// 文件夹绑定信息：id + 所属 spaceId，规则必须与文件夹共享同一 spaceId
type FolderLink = {
	id: string;
	spaceId: string;
};

// > 生成业务规则：模板循环，重复时加版本号区分；spaceId 一律从所选文件夹继承，保证绑定一致
const generateBusinessRules = (
	folderLinks: FolderLink[],
	uncategorizedSpaceId: string,
): RuleCreateData[] => {
	const rules: RuleCreateData[] = [];
	for (let i = 0; i < BUSINESS_RULE_COUNT; i += 1) {
		const template = ruleTemplates[i % ruleTemplates.length] as RuleTemplate;
		const serial = Math.floor(i / ruleTemplates.length) + 1;
		const name = serial > 1 ? `${template.name} v${serial}` : template.name;
		// 约 85% 进文件夹，15% folderId=null 测未分类
		const useFolder = i % 7 !== 0 && i % 7 !== 6;
		const folder = useFolder ? (folderLinks[i % folderLinks.length] ?? null) : null;
		const createdAt = makeDate(i, 5);
		rules.push({
			name,
			content: template.content,
			ownerId: OWNER_ID,
			spaceId: folder?.spaceId ?? uncategorizedSpaceId,
			folderId: folder?.id ?? null,
			createdAt,
			updatedAt: new Date(createdAt.getTime() + randomInt(0, 60) * 1000),
		});
	}
	return rules;
};

// > 生成超长正文规则：5 个主题各 1 条，content ~35000 字符，归到第一个文件夹
const generateLongContentRules = (folderLink: FolderLink): RuleCreateData[] => {
	const rules: RuleCreateData[] = [];
	for (let i = 0; i < LONG_CONTENT_COUNT; i += 1) {
		const builder = LONG_CONTENT_BUILDERS[i];
		const content = builder();
		const name = LONG_CONTENT_NAMES[i];
		const createdAt = makeDate(BUSINESS_RULE_COUNT + i, 5);
		rules.push({
			name,
			content,
			ownerId: OWNER_ID,
			spaceId: folderLink.spaceId,
			folderId: folderLink.id,
			createdAt,
			updatedAt: new Date(createdAt.getTime() + randomInt(0, 60) * 1000),
		});
	}
	return rules;
};

// > 生成边缘规则：每个边缘模板 1 条，spaceId 从所选文件夹继承
const generateEdgeRules = (folderLinks: FolderLink[]): RuleCreateData[] => {
	const rules: RuleCreateData[] = [];
	const offset = BUSINESS_RULE_COUNT + LONG_CONTENT_COUNT;
	for (let i = 0; i < EDGE_RULE_COUNT; i += 1) {
		const template = edgeRuleTemplates[i];
		if (!template) continue;
		const folder = folderLinks[i % folderLinks.length];
		if (!folder) continue;
		const createdAt = makeDate(offset + i, 5);
		rules.push({
			name: template.name,
			content: template.content,
			ownerId: OWNER_ID,
			spaceId: folder.spaceId,
			folderId: folder.id,
			createdAt,
			updatedAt: new Date(createdAt.getTime() + randomInt(0, 60) * 1000),
		});
	}
	return rules;
};

// > 生成补充规则：用业务模板填充至 120 条，覆盖更多文件夹
const generateFillerRules = (folderLinks: FolderLink[]): RuleCreateData[] => {
	const rules: RuleCreateData[] = [];
	const offset = BUSINESS_RULE_COUNT + LONG_CONTENT_COUNT + EDGE_RULE_COUNT;
	for (let i = 0; i < FILLER_RULE_COUNT; i += 1) {
		const template = ruleTemplates[(i + 3) % ruleTemplates.length] as RuleTemplate;
		const serial = Math.floor(i / ruleTemplates.length) + 1;
		const name = serial > 1 ? `${template.name}（补充）v${serial}` : `${template.name}（补充）`;
		const folder = folderLinks[(i + 1) % folderLinks.length];
		if (!folder) continue;
		const createdAt = makeDate(offset + i, 5);
		rules.push({
			name,
			content: template.content,
			ownerId: OWNER_ID,
			spaceId: folder.spaceId,
			folderId: folder.id,
			createdAt,
			updatedAt: new Date(createdAt.getTime() + randomInt(0, 60) * 1000),
		});
	}
	return rules;
};

const main = async (): Promise<void> => {
	logSection("查询绑定目标（领域/文件夹/标签）");

	const spaces = await prisma.ruleSpace.findMany({
		where: { ownerId: OWNER_ID, name: { in: SPACE_NAMES } },
		select: { id: true, name: true },
	});
	const folders = await prisma.folder.findMany({
		where: { ownerId: OWNER_ID, resourceType: "rules" },
		select: { id: true, name: true, ruleSpaceId: true },
	});
	const tags = await prisma.tag.findMany({
		where: { ownerId: OWNER_ID, resourceType: "rules", name: { in: TAG_NAMES } },
		select: { id: true, name: true },
	});

	if (spaces.length === 0) {
		throw new Error("测试领域不存在，请先运行 seed-spaces");
	}
	if (folders.length === 0) {
		throw new Error("测试文件夹不存在，请先运行 seed-folders");
	}
	if (tags.length === 0) {
		throw new Error("测试标签不存在，请先运行 seed-tags");
	}

	const spaceIds = spaces.map((s) => s.id);
	const tagIds = tags.map((t) => t.id);
	// 文件夹绑定信息：id + 所属 spaceId，规则必须与文件夹共享同一 spaceId
	const folderLinks: FolderLink[] = folders
		.filter((f) => f.ruleSpaceId !== null)
		.map((f) => ({ id: f.id, spaceId: f.ruleSpaceId as string }));
	// 未分类规则回落的领域（取第一个空间）
	const uncategorizedSpaceId = spaceIds[0];
	if (folderLinks.length === 0) {
		throw new Error("无可用文件夹绑定，请先运行 seed-folders");
	}
	logInfo(`领域 ${spaces.length} 个 / 文件夹 ${folderLinks.length} 个 / 标签 ${tags.length} 个`);

	logSection("清理旧测试规则");

	// 清理所有测试领域下的规则（不影响现有个人默认空间的规则）
	const deleted = await prisma.rule.deleteMany({
		where: { ownerId: OWNER_ID, spaceId: { in: spaceIds } },
	});
	console.log(`  · 已清理 ${deleted.count} 条旧测试规则`);

	// 同步清理可能残留的 RuleTag 联结（规则级联删除已处理，此处兜底）
	await prisma.ruleTag.deleteMany({
		where: { rule: { ownerId: OWNER_ID, spaceId: { in: spaceIds } } },
	});

	logSection("生成规则数据");

	// 超长正文规则归到第一个文件夹
	const longContentFolder = folderLinks[0] as FolderLink;

	const businessRules = generateBusinessRules(folderLinks, uncategorizedSpaceId);
	const longContentRules = generateLongContentRules(longContentFolder);
	const edgeRules = generateEdgeRules(folderLinks);
	const fillerRules = generateFillerRules(folderLinks);

	const allRules = [...businessRules, ...longContentRules, ...edgeRules, ...fillerRules];
	logInfo(
		`业务 ${businessRules.length} / 超长 ${longContentRules.length} / 边缘 ${edgeRules.length} / 补充 ${fillerRules.length}`,
	);

	logSection("写入规则");

	await prisma.rule.createMany({ data: allRules });

	// 写入后重新查询拿到生成的 ruleId（createMany 不返回 id）
	const createdRules = await prisma.rule.findMany({
		where: { ownerId: OWNER_ID, spaceId: { in: spaceIds } },
		select: { id: true, name: true, content: true, spaceId: true, folderId: true, createdAt: true },
		orderBy: { createdAt: "asc" },
	});
	logOk(`写入 ${createdRules.length} 条规则`);

	logSection("绑定标签（RuleTag 联动）");

	// 为约 80% 的规则随机绑 1-3 个标签，其余 0 标签测空标签场景
	const ruleTagData: { ruleId: string; tagId: string }[] = [];
	for (let i = 0; i < createdRules.length; i += 1) {
		// 每 5 条留 1 条不绑标签（约 20% 空标签）
		if (i % 5 === 4) continue;
		const tagCount = randomInt(1, 3);
		// 随机选 tagCount 个不重复标签
		const shuffled = [...tagIds].sort(() => Math.random() - 0.5);
		const selected = shuffled.slice(0, tagCount);
		for (const tagId of selected) {
			ruleTagData.push({ ruleId: createdRules[i].id, tagId });
		}
	}
	await prisma.ruleTag.createMany({ data: ruleTagData, skipDuplicates: true });
	logOk(`写入 ${ruleTagData.length} 条 RuleTag 联结记录`);

	logSection("断言验证");

	// 1. 规则总数
	assertEqual({ actual: createdRules.length, expected: RULE_COUNT, label: "规则总数" });

	// 2. 每条规则 spaceId 非空（必填约束验证）
	let nullSpaceRules = 0;
	for (const r of createdRules) {
		if (!r.spaceId) nullSpaceRules += 1;
	}
	assertEqual({ actual: nullSpaceRules, expected: 0, label: "spaceId 为空的规则数（应为 0）" });

	// 3. 存在 folderId=null 的未分类规则
	const uncategorizedCount = createdRules.filter((r) => r.folderId === null).length;
	assertTrue({
		condition: uncategorizedCount > 0,
		label: `存在未分类规则（folderId=null）：${uncategorizedCount} 条`,
	});

	// 4. folderId 非空的规则能查到对应 Folder，且 Folder.ruleSpaceId 与 Rule.spaceId 一致
	const folderById = new Map(folders.map((f) => [f.id, f]));
	let bindMismatch = 0;
	for (const r of createdRules) {
		if (r.folderId) {
			const folder = folderById.get(r.folderId);
			if (!folder || folder.ruleSpaceId !== r.spaceId) bindMismatch += 1;
		}
	}
	assertEqual({
		actual: bindMismatch,
		expected: 0,
		label: "规则-文件夹-领域绑定不一致数（应为 0）",
	});

	// 5. 超长正文规则 content 字符数落在 30000~45000 区间
	// 用 Set<string> 匹配，规避 readonly 字面量元组的 includes 类型收窄
	const longNameSet = new Set<string>(LONG_CONTENT_NAMES);
	const longRules = createdRules.filter((r) => longNameSet.has(r.name));
	assertEqual({
		actual: longRules.length,
		expected: LONG_CONTENT_COUNT,
		label: "超长正文规则数量",
	});
	for (const r of longRules) {
		assertRange({
			value: r.content.length,
			min: LONG_CONTENT_MIN,
			max: LONG_CONTENT_MAX,
			label: `超长正文「${r.name.slice(0, 12)}…」字符数`,
		});
	}

	// 6. 64 字符名规则名称长度验证
	const longNameRule = createdRules.find((r) => r.name.length === 64);
	assertTrue({
		condition: longNameRule !== undefined,
		label: "存在正好 64 字符名称的规则",
	});

	// 7. RuleTag 联结数 > 0，且每条联结的 ruleId/tagId 均能回查
	const ruleTagCount = await prisma.ruleTag.count();
	assertTrue({
		condition: ruleTagCount > 0,
		label: `RuleTag 联结记录数 > 0（${ruleTagCount} 条）`,
	});

	// 抽查 10 条联结记录的完整性
	const sampleTags = await prisma.ruleTag.findMany({ take: 10 });
	const ruleIdSet = new Set(createdRules.map((r) => r.id));
	const tagIdSet = new Set(tagIds);
	for (const rt of sampleTags) {
		if (!ruleIdSet.has(rt.ruleId) || !tagIdSet.has(rt.tagId)) {
			throw new Error(`断言失败：RuleTag(${rt.ruleId}, ${rt.tagId}) 回查失败`);
		}
	}
	logOk("抽样 10 条 RuleTag 联结记录均能回查到规则与标签");

	// 8. 超长正文规则至少绑定了标签（联动覆盖）
	const longRuleIds = new Set(longRules.map((r) => r.id));
	const longRuleTagged = await prisma.ruleTag.findFirst({
		where: { ruleId: { in: [...longRuleIds] } },
	});
	assertTrue({
		condition: longRuleTagged !== null,
		label: "超长正文规则已联动标签",
	});

	// 9. 汇总
	const totalContentChars = createdRules.reduce((sum, r) => sum + r.content.length, 0);
	logInfo(`规则正文总字符数: ${totalContentChars}（含超长正文压测数据）`);
};

main()
	.catch((error: unknown) => {
		console.error("填充测试规则失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
