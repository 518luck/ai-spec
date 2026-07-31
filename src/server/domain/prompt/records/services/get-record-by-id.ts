// # 收录单条详情：返回全文 + tags（编辑回填用），where 含 ownerId 防越权

import { AiSpecError } from "@/server/errors/http-error";
import { mapTags } from "@/server/utils/map-tags";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { RecordContentVo } from "@/shared/lib/zod/schemas/prompt/record";

export const getRecordById = async ({
	userId,
	id,
}: {
	userId: string;
	id: string;
}): Promise<RecordContentVo> => {
	const record = await prisma.promptRecord.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			content: true,
			folderId: true,
			tags: { include: { tag: true } },
			ownerId: true,
		},
	});

	// 收录不存在或不是当前用户所有，统一返回 404（避免暴露资源归属）
	if (!record || record.ownerId !== userId) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "收录不存在" });
	}

	// ownerId 仅用于权限校验，不返回给前端
	const { ownerId: _ownerId, ...rest } = record;
	return { ...rest, tags: mapTags(rest.tags) };
};
