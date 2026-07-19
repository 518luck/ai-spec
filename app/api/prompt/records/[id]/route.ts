import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { recordContentVoSchema } from "@/shared/lib/zod/schemas/prompt/record";

// # 单条收录全文：按 id 拉取 content（供卡片复制全文），归属隔离统一走 ownerId 进 where

// > 按 id 获取收录全文（where 含 ownerId 防止越权读取他人收录）
export const GET = withPersonal(
	async ({ ctx, session }) => {
		const { id: rawId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;

		const record = await prisma.promptRecord.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				content: true,
				folderId: true,
				tags: { include: { tag: true } },
				ownerId: true,
			},
		});

		// 收录不存在或不是当前用户所有，统一返回 404（避免暴露资源归属）
		if (!record || record.ownerId !== session.user.id) {
			throw new AiSpecError({ code: "NOT_FOUND", message: "收录不存在" });
		}

		// ownerId 仅用于权限校验，不返回给前端；folderId 直接透传 null；tags 关联映射为扁平 {id,name,color} 数组
		const { ownerId: _ownerId, ...rest } = record;
		const result = recordContentVoSchema.safeParse({
			...rest,
			tags: rest.tags.map((t) => ({ ...t.tag })),
		});
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptRecord.read"] },
);
