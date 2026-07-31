// # 硬删除草稿：where 含 ownerId，删除他人草稿时 Prisma P2025 自动映射为 404，不暴露归属

import prisma from "@/shared/db";

export const deleteDraft = async ({
	userId,
	id,
}: {
	userId: string;
	id: string;
}): Promise<void> => {
	await prisma.promptDraft.delete({
		where: { id, ownerId: userId },
	});
};
