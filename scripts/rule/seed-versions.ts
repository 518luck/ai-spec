import "dotenv/config";

import { calculateDiff, reconstructContent, serializeDiff } from "@/server/utils/diff";
import prisma from "@/shared/db";
import { SPACE_NAMES } from "./config/spaces";
import { OWNER_ID } from "./utils/constants";
import { assertEqual, assertTrue, logInfo, logOk, logSection, makeDate } from "./utils/helpers";

// # 规约版本历史填充脚本：为精选规则生成 RuleVersion，覆盖分页、diff 重建与快照锚点

// 高版本数规则的版本数：压测版本列表分页 + 多段 diff 重建链
const HIGH_VERSION_COUNT = 50;
// 少量版本规则条数：覆盖普通 diff 重建（无快照锚点回退）
const FEW_VERSION_RULE_COUNT = 10;
// 少量版本规则的版本数区间
const FEW_VERSION_MIN = 3;
const FEW_VERSION_MAX = 5;

// 快照策略：v1 强制快照 + 每 10 版一次快照锚点（与 update-rule-and-version 保持一致）
const isSnapshotVersion = (versionNumber: number): boolean =>
	versionNumber === 1 || versionNumber % 10 === 0;

// 版本内容微调：每次追加一行修订记录，制造与前版本可追踪的行级 diff
const mutateContent = (content: string, version: number): string => {
	const edits = [
		`- [v${version}] 补充了异常处理流程`,
		`- [v${version}] 新增性能基准数据`,
		`- [v${version}] 修正了术语表述`,
		`- [v${version}] 增加了架构示意图说明`,
		`- [v${version}] 完善了安全注意事项`,
	];
	return `${content}\n${edits[version % edits.length]}`;
};

// 单条版本的写入数据（createMany 标量字段）
type VersionCreateData = {
	ruleId: string;
	editorId: string;
	versionNumber: number;
	message: string;
	isSnapshot: boolean;
	snapshot: string | null;
	diff: string | null;
	createdAt: Date;
};

// 正向演化并收集某规则的全部版本数据；返回最终内容用于回写 rule.content
type EvolveResult = {
	versions: VersionCreateData[];
	finalContent: string;
};

// > 按版本号正向演化：v1 存当前 content 快照，v≥2 mutate 后算与上一版增量 diff
const evolveVersions = ({
	ruleId,
	baseContent,
	count,
	baseIndex,
	messagePrefix,
}: {
	ruleId: string;
	baseContent: string;
	count: number;
	baseIndex: number;
	messagePrefix: string;
}): EvolveResult => {
	let currentContent = baseContent;
	const versions: VersionCreateData[] = [];

	for (let v = 1; v <= count; v += 1) {
		const isSnapshot = isSnapshotVersion(v);
		const prevContent = currentContent;

		// v>=2 微调内容，制造与前版本的差异
		if (v >= 2) {
			currentContent = mutateContent(currentContent, v);
		}

		versions.push({
			ruleId,
			editorId: OWNER_ID,
			versionNumber: v,
			message: `${messagePrefix} 第 ${v} 版${isSnapshot ? "（快照锚点）" : ""}`,
			isSnapshot,
			snapshot: isSnapshot ? currentContent : null,
			// 增量版用项目 diff 工具计算与上一版的差异，格式与真实保存接口一致
			diff: isSnapshot
				? null
				: serializeDiff(calculateDiff({ oldText: prevContent, newText: currentContent })),
			createdAt: makeDate(baseIndex + v, 3),
		});
	}

	return { versions, finalContent: currentContent };
};

// > 校验 diff 链可重建：取一个增量版本，用最近快照 + 区间 diff 重建，内容应与该版本应有内容一致
const verifyReconstruction = ({ versions }: { versions: VersionCreateData[] }): void => {
	// 找第一个增量版本（非快照）做重建校验
	const target = versions.find((v) => !v.isSnapshot);
	if (!target) {
		assertTrue({ condition: false, label: "存在增量版本可做重建校验" });
		return;
	}

	// 找 <= target 的最近快照
	const nearestSnapshot = [...versions]
		.filter((v) => v.isSnapshot && v.versionNumber <= target.versionNumber)
		.sort((a, b) => b.versionNumber - a.versionNumber)[0];
	if (!nearestSnapshot?.snapshot) {
		assertTrue({ condition: false, label: "存在可回退的快照锚点" });
		return;
	}

	// 收集区间 (snapshot, target] 的增量 diff，按版本号升序套用
	const diffs = versions
		.filter(
			(v) =>
				v.versionNumber > nearestSnapshot.versionNumber && v.versionNumber <= target.versionNumber,
		)
		.sort((a, b) => a.versionNumber - b.versionNumber)
		.map((v) => JSON.parse(v.diff as string));

	// 重建出的内容应等于 target 版本应有内容；先正向演化到 target 拿到应有内容
	let expected = versions[0]?.snapshot ?? "";
	for (let v = 2; v <= target.versionNumber; v += 1) {
		expected = mutateContent(expected, v);
	}

	const reconstructed = reconstructContent({ snapshot: nearestSnapshot.snapshot, diffs });
	assertTrue({
		condition: reconstructed === expected,
		label: `v${target.versionNumber} diff 链重建内容一致`,
	});
};

const main = async (): Promise<void> => {
	logSection("查询测试规则");

	const spaces = await prisma.ruleSpace.findMany({
		where: { ownerId: OWNER_ID, name: { in: SPACE_NAMES } },
		select: { id: true },
	});
	if (spaces.length === 0) {
		throw new Error("测试领域不存在，请先运行 seed-spaces");
	}
	const spaceIds = spaces.map((s) => s.id);

	// 按 createdAt 升序读回测试规则，取 id + content 用于版本演化
	const rules = await prisma.rule.findMany({
		where: { ownerId: OWNER_ID, spaceId: { in: spaceIds } },
		select: { id: true, content: true },
		orderBy: { createdAt: "asc" },
	});
	if (rules.length === 0) {
		throw new Error("测试规则不存在，请先运行 seed-rules");
	}
	logInfo(`测试规则 ${rules.length} 条`);

	logSection("清理旧版本记录");

	const deleted = await prisma.ruleVersion.deleteMany({
		where: { rule: { ownerId: OWNER_ID, spaceId: { in: spaceIds } } },
	});
	console.log(`  · 已清理 ${deleted.count} 条旧版本记录`);

	logSection("生成版本数据");

	const allVersions: VersionCreateData[] = [];
	const ruleContentUpdates: { id: string; content: string }[] = [];

	// ① 高版本数规则：取第一条业务规则，造 50 个版本（压测分页 + 多段 diff 重建）
	const highVersionRule = rules[0];
	if (highVersionRule) {
		const { versions, finalContent } = evolveVersions({
			ruleId: highVersionRule.id,
			baseContent: highVersionRule.content,
			count: HIGH_VERSION_COUNT,
			baseIndex: 0,
			messagePrefix: "高版本压测",
		});
		allVersions.push(...versions);
		ruleContentUpdates.push({ id: highVersionRule.id, content: finalContent });
		logInfo(`高版本规则 ${highVersionRule.id}：${HIGH_VERSION_COUNT} 个版本`);
	}

	// ② 少量版本规则：取接下来 10 条，各造 3-5 个版本（覆盖无快照锚点回退场景）
	const fewVersionRules = rules.slice(1, 1 + FEW_VERSION_RULE_COUNT);
	for (let i = 0; i < fewVersionRules.length; i += 1) {
		const rule = fewVersionRules[i];
		if (!rule) continue;
		const count = FEW_VERSION_MIN + (i % (FEW_VERSION_MAX - FEW_VERSION_MIN + 1));
		const { versions, finalContent } = evolveVersions({
			ruleId: rule.id,
			baseContent: rule.content,
			count,
			baseIndex: 100 + i * 10,
			messagePrefix: "常规修订",
		});
		allVersions.push(...versions);
		ruleContentUpdates.push({ id: rule.id, content: finalContent });
	}
	logInfo(
		`少量版本规则 ${fewVersionRules.length} 条：各 ${FEW_VERSION_MIN}-${FEW_VERSION_MAX} 个版本`,
	);

	// ③ 其余规则不造版本，测"无版本历史"空态
	const zeroVersionCount = rules.length - 1 - fewVersionRules.length;
	logInfo(`零版本规则 ${zeroVersionCount} 条（测空态）`);

	logSection("写入版本记录");

	await prisma.ruleVersion.createMany({ data: allVersions });
	logOk(`写入 ${allVersions.length} 条版本记录`);

	// 回写规则的 content 到最终版，保证详情页展示与最新版本一致
	for (const { id, content } of ruleContentUpdates) {
		await prisma.rule.update({ where: { id }, data: { content } });
	}
	logOk(`回写 ${ruleContentUpdates.length} 条规则的最终内容`);

	logSection("断言验证");

	// 1. 高版本数规则：版本数、快照锚点数、versionNumber 连续性
	if (highVersionRule) {
		const highVersions = await prisma.ruleVersion.findMany({
			where: { ruleId: highVersionRule.id },
			orderBy: { versionNumber: "asc" },
			select: { versionNumber: true, isSnapshot: true, snapshot: true, diff: true },
		});
		assertEqual({
			actual: highVersions.length,
			expected: HIGH_VERSION_COUNT,
			label: "高版本规则版本数",
		});

		const snapshotCount = highVersions.filter((v) => v.isSnapshot).length;
		// v1 + v10/v20/v30/v40/v50 = 6
		assertEqual({ actual: snapshotCount, expected: 6, label: "快照锚点数" });

		// versionNumber 连续无缺口：1..50
		const numbers = highVersions.map((v) => v.versionNumber);
		const isContinuous = numbers.every((n, i) => n === i + 1);
		assertTrue({ condition: isContinuous, label: "versionNumber 连续无缺口（1..50）" });

		// 快照版本 snapshot 非空、增量版本 diff 非空
		const snapshotFilled = highVersions.every((v) =>
			v.isSnapshot === true ? v.snapshot !== null : v.diff !== null,
		);
		assertTrue({ condition: snapshotFilled, label: "快照/增量字段填充正确" });

		// 重建校验：diff 链能从最近快照重建出目标版本内容
		verifyReconstruction({ versions: allVersions.filter((v) => v.ruleId === highVersionRule.id) });
	}

	// 2. 少量版本规则：版本数落在 3-5、且每条至少 1 个增量版本
	const fewRuleIds = fewVersionRules.map((r) => r.id);
	const fewCounts = await prisma.ruleVersion.groupBy({
		by: ["ruleId"],
		where: { ruleId: { in: fewRuleIds } },
		_count: { _all: true },
	});
	for (const g of fewCounts) {
		assertTrue({
			condition: g._count._all >= FEW_VERSION_MIN && g._count._all <= FEW_VERSION_MAX,
			label: `少量版本规则 ${g.ruleId.slice(-6)} 版本数在 ${FEW_VERSION_MIN}-${FEW_VERSION_MAX}`,
		});
	}

	// 3. 零版本规则确实无版本记录
	const zeroVersionRuleIds = rules.slice(1 + FEW_VERSION_RULE_COUNT).map((r) => r.id);
	if (zeroVersionRuleIds.length > 0) {
		const zeroCount = await prisma.ruleVersion.count({
			where: { ruleId: { in: zeroVersionRuleIds } },
		});
		assertEqual({ actual: zeroCount, expected: 0, label: "零版本规则无版本记录" });
	}

	// 4. 汇总
	logInfo(
		`版本记录总数: ${allVersions.length}（高版本 1×${HIGH_VERSION_COUNT} + 少量版本 ${fewVersionRules.length} 条）`,
	);
};

main()
	.catch((error: unknown) => {
		console.error("填充规约版本失败:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
