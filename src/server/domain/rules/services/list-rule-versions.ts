// # 查询规约版本列表：按版本号倒序，校验规约归属

import { AiSpecError } from "@/server/errors/http-error";
import { mapEditor } from "@/server/utils/map-editor";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { VersionListVo } from "@/shared/lib/zod/schemas/prompt/record";

export const listRuleVersions = async ({
	userId,
	ruleId,
	page,
	pageSize,
}: {
	userId: string;
	ruleId: string;
	page: number;
	pageSize: number;
}): Promise<VersionListVo> => {
	const rule = await prisma.rule.findUnique({
		where: { id: ruleId },
		select: { ownerId: true },
	});
	if (!rule || rule.ownerId !== userId) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "规约不存在" });
	}

	const offset = (page - 1) * pageSize;
	const [versions, total] = await Promise.all([
		prisma.ruleVersion.findMany({
			where: { ruleId },
			orderBy: { versionNumber: "desc" },
			skip: offset,
			take: pageSize,
			select: {
				id: true,
				versionNumber: true,
				message: true,
				isSnapshot: true,
				createdAt: true,
				editor: { select: { id: true, name: true, image: true } },
			},
		}),
		prisma.ruleVersion.count({ where: { ruleId } }),
	]);

	return {
		data: versions.map((v) => ({
			id: v.id,
			versionNumber: v.versionNumber,
			message: v.message,
			isSnapshot: v.isSnapshot,
			createdAt: v.createdAt.toISOString(),
			editor: mapEditor(v.editor),
		})),
		total,
		hasMore: versions.length === pageSize,
	};
};
