// # 版本历史列表：获取某收录的全部版本记录（分页）

import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import { listVersionsDtoSchema, versionListVoSchema } from "@/shared/lib/zod/schemas/prompt/record";

// > 获取版本历史列表：按版本号倒序返回，支持分页
export const GET = withPersonal(
	async ({ ctx, session, searchParams }) => {
		const { id: rawId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;

		// 校验入参
		const parsed = listVersionsDtoSchema.safeParse(searchParams);
		if (!parsed.success) {
			throw parsed.error;
		}
		const { offset = 0, limit = 20 } = parsed.data;

		// > 验证收录存在且归属当前用户
		const record = await prisma.promptRecord.findUnique({
			where: { id },
			select: { ownerId: true },
		});

		if (!record || record.ownerId !== session.user.id) {
			throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "收录不存在" });
		}

		// > 查询版本列表
		const [versions, total] = await Promise.all([
			prisma.promptRecordVersion.findMany({
				where: { recordId: id },
				orderBy: { versionNumber: "desc" },
				skip: offset,
				take: limit,
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
			prisma.promptRecordVersion.count({ where: { recordId: id } }),
		]);

		// 校验出参
		const result = versionListVoSchema.safeParse({
			data: versions.map((v) => ({
				...v,
				createdAt: v.createdAt.toISOString(),
			})),
			total,
			hasMore: offset + limit < total,
			nextOffset: offset + limit < total ? offset + limit : undefined,
		});
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptRecord.read"] },
);
