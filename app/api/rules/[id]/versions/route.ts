// # 规约版本历史列表：获取某规约的全部版本记录（分页）

import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import { listVersionsDtoSchema, versionListVoSchema } from "@/shared/lib/zod/schemas/prompt/record";

// > 获取版本历史列表：按版本号倒序返回，支持分页
export const GET = withPersonal(async ({ ctx, session, searchParams }) => {
	const { id: rawId } = await ctx.params;
	const id = Array.isArray(rawId) ? rawId[0] : rawId;

	// 校验入参
	const parsed = listVersionsDtoSchema.safeParse(searchParams);
	if (!parsed.success) {
		throw parsed.error;
	}
	const { page = 1, pageSize } = parsed.data;
	const size = pageSize ?? 20;
	// page 1-based → Prisma 的 skip 偏移量
	const offset = (page - 1) * size;

	// > 验证规约存在且归属当前用户
	const rule = await prisma.rule.findUnique({
		where: { id },
		select: { ownerId: true },
	});

	if (!rule || rule.ownerId !== session.user.id) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "规约不存在" });
	}

	// > 查询版本列表
	const [versions, total] = await Promise.all([
		prisma.ruleVersion.findMany({
			where: { ruleId: id },
			orderBy: { versionNumber: "desc" },
			skip: offset,
			take: size,
			select: {
				id: true,
				versionNumber: true,
				message: true,
				isSnapshot: true,
				createdAt: true,
				editor: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
		}),
		prisma.ruleVersion.count({ where: { ruleId: id } }),
	]);

	// 校验出参：本次返回满一页说明可能还有更多
	const result = versionListVoSchema.safeParse({
		data: versions.map((v) => ({
			...v,
			createdAt: v.createdAt.toISOString(),
		})),
		total,
		hasMore: versions.length === size,
	});
	if (!result.success) {
		throw result.error;
	}

	return NextResponse.json(result.data);
});
