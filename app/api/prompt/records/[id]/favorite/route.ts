// # 单条收录的收藏开关：POST 加入收藏 / DELETE 取消收藏（API Key 接入需 promptRecord.write）

import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";

// > 加入收藏：校验收录归属当前用户后 upsert PromptFavorite（复合唯一键防止重复）
export const POST = withPersonal(
	async ({ ctx, session }) => {
		const { id: rawId } = await ctx.params;
		const recordId = Array.isArray(rawId) ? rawId[0] : rawId;

		// 校验收录存在且属于当前用户，否则统一返回 404（不暴露资源归属）
		const record = await prisma.promptRecord.findUnique({
			where: { id: recordId },
			select: { ownerId: true },
		});
		if (!record || record.ownerId !== session.user.id) {
			throw new AiSpecError({ code: "NOT_FOUND", message: "收录不存在" });
		}

		await prisma.promptFavorite.upsert({
			where: { userId_recordId: { userId: session.user.id, recordId } },
			create: { userId: session.user.id, recordId },
			update: {},
		});

		return NextResponse.json({ favorite: true });
	},
	{ permissions: ["promptRecord.write"] },
);

// > 取消收藏：deleteMany 幂等，重复取消不报 P2025
export const DELETE = withPersonal(
	async ({ ctx, session }) => {
		const { id: rawId } = await ctx.params;
		const recordId = Array.isArray(rawId) ? rawId[0] : rawId;

		await prisma.promptFavorite.deleteMany({
			where: { userId: session.user.id, recordId },
		});

		return NextResponse.json({ favorite: false });
	},
	{ permissions: ["promptRecord.write"] },
);
