// # 创建草稿：以 userId 为 owner 写入 PromptDraft（草稿不存版本、不存 tags）

import prisma from "@/shared/db";
import type { CreateDraftVo } from "@/shared/lib/zod/schemas/prompt/draft";

// 创建入参（与 createDraftDtoSchema 对齐）
type CreateParams = {
	userId: string;
	name: string;
	content: string;
	images: string[];
	folderId: string | null;
};

export const createDraft = async ({
	userId,
	name,
	content,
	images,
	folderId,
}: CreateParams): Promise<CreateDraftVo> => {
	const draft = await prisma.promptDraft.create({
		data: {
			name,
			content,
			images,
			ownerId: userId,
			folderId: folderId || null,
		},
		select: {
			id: true,
			name: true,
			content: true,
			folderId: true,
			updatedAt: true,
		},
	});

	// updatedAt 由 Date 转 ISO 字符串，folderId 直接透传 null（VO schema 已为 nullable）
	return {
		id: draft.id,
		name: draft.name,
		content: draft.content,
		folderId: draft.folderId,
		updatedAt: draft.updatedAt.toISOString(),
	};
};
