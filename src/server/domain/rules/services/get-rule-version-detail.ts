// # 规约版本详情：快照直接用 / 增量从 nearestSnapshot 重建完整内容

import { AiSpecError } from "@/server/errors/http-error";
import { deserializeDiff, reconstructContent } from "@/server/utils/diff";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { VersionDetailVo } from "@/shared/lib/zod/schemas/prompt/record";
import { mapEditor } from "@/server/utils/map-editor";

export const getRuleVersionDetail = async ({
	userId,
	ruleId,
	versionId,
}: {
	userId: string;
	ruleId: string;
	versionId: string;
}): Promise<VersionDetailVo> => {
	// 校验规约归属，同时取 name 作为版本详情标题
	const rule = await prisma.rule.findUnique({
		where: { id: ruleId },
		select: { ownerId: true, name: true },
	});
	if (!rule || rule.ownerId !== userId) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "规约不存在" });
	}

	const targetVersion = await prisma.ruleVersion.findUnique({
		where: { id: versionId, ruleId },
		select: {
			id: true,
			versionNumber: true,
			message: true,
			isSnapshot: true,
			snapshot: true,
			diff: true,
			createdAt: true,
			editor: { select: { id: true, name: true, image: true } },
		},
	});
	if (!targetVersion) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "版本不存在" });
	}

	// 重建完整内容
	let content: string;
	if (targetVersion.isSnapshot && targetVersion.snapshot) {
		// 快照版本直接返回
		content = targetVersion.snapshot;
	} else {
		// 增量版本：从最近的快照开始重建
		const nearestSnapshot = await prisma.ruleVersion.findFirst({
			where: { ruleId, isSnapshot: true, versionNumber: { lte: targetVersion.versionNumber } },
			orderBy: { versionNumber: "desc" },
			select: { versionNumber: true, snapshot: true },
		});
		if (!nearestSnapshot?.snapshot) {
			throw new AiSpecError({
				code: ErrorCode.INTERNAL_ERROR,
				message: "无法重建版本：找不到基准快照",
			});
		}
		// 获取重建所需的所有 diff：区间 (nearestSnapshot, target] 左开右闭
		// > orderBy 必须 asc：说明书按版本号顺序逐张套用，倒序会让后续 diff 错套到旧内容上
		const diffs = await prisma.ruleVersion.findMany({
			where: {
				ruleId,
				versionNumber: { gt: nearestSnapshot.versionNumber, lte: targetVersion.versionNumber },
			},
			orderBy: { versionNumber: "asc" },
			select: { diff: true },
		});
		content = reconstructContent({
			snapshot: nearestSnapshot.snapshot,
			diffs: diffs.filter((d) => d.diff !== null).map((d) => deserializeDiff(d.diff as string)),
		});
	}

	return {
		id: targetVersion.id,
		versionNumber: targetVersion.versionNumber,
		message: targetVersion.message,
		isSnapshot: targetVersion.isSnapshot,
		name: rule.name,
		content,
		createdAt: targetVersion.createdAt.toISOString(),
		editor: mapEditor(targetVersion.editor),
	};
};
