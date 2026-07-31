// # 硬删除收录：where 含 ownerId 做归属隔离
// > 关联子表（versions/tags/favorites）均为 onDelete: Cascade，数据库自动级联清理，无需事务

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

export const deleteRecord = async ({
	userId,
	id,
}: {
	userId: string;
	id: string;
}): Promise<void> => {
	const existing = await prisma.promptRecord.findFirst({ where: { id, ownerId: userId } });
	if (!existing) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "收录不存在" });
	}
	await prisma.promptRecord.delete({ where: { id } });
};
