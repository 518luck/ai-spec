// # 收录版本列表：按版本号倒序，校验收录归属

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { VersionListVo } from "@/shared/lib/zod/schemas/prompt/record";
import { mapEditor } from "@/server/utils/map-editor";

export const listRecordVersions = async ({
	userId,
	recordId,
	page,
	pageSize,
}: {
	userId: string;
	recordId: string;
	page: number;
	pageSize: number;
}): Promise<VersionListVo> => {
	const record = await prisma.promptRecord.findUnique({
		where: { id: recordId },
		select: { ownerId: true },
	});
	if (!record || record.ownerId !== userId) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "收录不存在" });
	}

	const offset = (page - 1) * pageSize;
	const [versions, total] = await Promise.all([
		prisma.promptRecordVersion.findMany({
			where: { recordId },
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
		prisma.promptRecordVersion.count({ where: { recordId } }),
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
