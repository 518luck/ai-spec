// # 加入收藏：校验收录归属当前用户后手动幂等创建（存在即跳过，避免 upsert 复合唯一键耦合）
// ? 当前阶段（团队未实现）所有收藏都是个人空间收藏，teamMemberId 固定为 null

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

export const favoriteRecord = async ({
	userId,
	recordId,
}: {
	userId: string;
	recordId: string;
}): Promise<{ favorite: true }> => {
	// 校验收录存在且属于当前用户，否则统一返回 404（不暴露资源归属）
	const record = await prisma.promptRecord.findUnique({
		where: { id: recordId },
		select: { ownerId: true },
	});
	if (!record || record.ownerId !== userId) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "收录不存在" });
	}

	// 手动幂等：已存在收藏记录则跳过，避免重复 create 撞唯一键
	const existing = await prisma.promptFavorite.findFirst({
		where: { userId, recordId, teamMemberId: null },
		select: { id: true },
	});
	if (!existing) {
		await prisma.promptFavorite.create({
			data: { userId, recordId, teamMemberId: null },
		});
	}

	return { favorite: true };
};
