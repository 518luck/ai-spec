import { NextResponse } from "next/server";
import { z } from "zod";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

// # 批量删除规约

const batchDeleteSchema = z.object({
	ids: z.array(z.string()).min(1, "至少选择一条规约"),
});

// > 批量删除：校验归属后一次 deleteMany，避免 N 次数据库往返
export const DELETE = withPersonal(async ({ req, session }) => {
	const parsed = batchDeleteSchema.safeParse(await req.json());
	if (!parsed.success) {
		throw parsed.error;
	}
	const { ids } = parsed.data;

	// 先查出属于当前用户的规约 ID，过滤掉不存在的或别人的
	const ownedCount = await prisma.rule.count({
		where: {
			id: { in: ids },
			ownerId: session.user.id,
		},
	});

	if (ownedCount === 0) {
		throw new AiSpecError({
			code: ErrorCode.NOT_FOUND,
			message: "所选规约不存在或无权操作",
		});
	}

	// 仅删除当前用户拥有的规约
	await prisma.rule.deleteMany({
		where: {
			id: { in: ids },
			ownerId: session.user.id,
		},
	});

	return NextResponse.json({ success: true, deletedCount: ownedCount });
});
