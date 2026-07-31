// # 部分更新草稿：纯 update，草稿不存版本（无事务无版本记录）
// ownerId 进 where 做归属隔离；记录不存在或不属于当前用户时 Prisma P2025 → 由拦截器映射为 404

import prisma from "@/shared/db";
import type { CreateDraftVo } from "@/shared/lib/zod/schemas/prompt/draft";

// 更新入参（与 updateDraftDtoSchema 对齐，所有字段可选；refine 保证至少一个字段）
type UpdatePatch = {
	name?: string;
	content?: string;
	images?: string[];
	folderId?: string | null;
};

export const updateDraft = async ({
	userId,
	id,
	patch,
}: {
	userId: string;
	id: string;
	patch: UpdatePatch;
}): Promise<CreateDraftVo> => {
	// 构建部分更新数据：只更新传入的字段
	const data: Record<string, unknown> = {};
	if (patch.name !== undefined) data.name = patch.name;
	if (patch.content !== undefined) data.content = patch.content;
	if (patch.images !== undefined) data.images = patch.images;
	if (patch.folderId !== undefined) data.folderId = patch.folderId || null;

	const updated = await prisma.promptDraft.update({
		where: { id, ownerId: userId },
		data,
		select: { id: true, name: true, content: true, folderId: true, updatedAt: true },
	});

	// updatedAt 由 Date 转 ISO 字符串，folderId 直接透传 null（VO schema 已为 nullable）
	return {
		id: updated.id,
		name: updated.name,
		content: updated.content,
		folderId: updated.folderId,
		updatedAt: updated.updatedAt.toISOString(),
	};
};
