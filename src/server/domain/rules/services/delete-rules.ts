// # 批量删除规约：校验归属后一次 deleteMany，返回实际删除数

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

export const deleteRules = async ({ userId, ids }: { userId: string; ids: string[] }) => {
	const ownedCount = await prisma.rule.count({
		where: { id: { in: ids }, ownerId: userId },
	});
	if (ownedCount === 0) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "所选规约不存在或无权操作" });
	}
	await prisma.rule.deleteMany({ where: { id: { in: ids }, ownerId: userId } });
	return { success: true, deletedCount: ownedCount };
};
