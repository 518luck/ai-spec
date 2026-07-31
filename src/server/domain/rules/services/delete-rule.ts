// # 删除单条规约：校验归属后删除

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

export const deleteRule = async ({ userId, id }: { userId: string; id: string }) => {
	const existing = await prisma.rule.findFirst({ where: { id, ownerId: userId } });
	if (!existing) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "规约不存在" });
	}
	await prisma.rule.delete({ where: { id } });
};
