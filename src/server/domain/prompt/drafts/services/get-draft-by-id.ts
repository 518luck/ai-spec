// # 草稿单条详情：按 id 拉取全文（name 可为 null，区别于 record 的必填）；where 含 ownerId 防越权

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { DraftContentVo } from "@/shared/lib/zod/schemas/prompt/draft";

export const getDraftById = async ({
	userId,
	id,
}: {
	userId: string;
	id: string;
}): Promise<DraftContentVo> => {
	const draft = await prisma.promptDraft.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			content: true,
			folderId: true,
			ownerId: true,
		},
	});

	// 草稿不存在或不是当前用户所有，统一返回 404（避免暴露资源归属）
	if (!draft || draft.ownerId !== userId) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "草稿不存在" });
	}

	// ownerId 仅用于权限校验，不返回给前端
	return {
		id: draft.id,
		name: draft.name,
		content: draft.content,
		folderId: draft.folderId,
	};
};
