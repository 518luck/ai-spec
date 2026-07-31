// # 取消收藏：deleteMany 幂等，重复取消不报错

import prisma from "@/shared/db";

export const unfavoriteRecord = async ({
	userId,
	recordId,
}: {
	userId: string;
	recordId: string;
}): Promise<{ favorite: false }> => {
	await prisma.promptFavorite.deleteMany({
		where: { userId, recordId },
	});

	return { favorite: false };
};
