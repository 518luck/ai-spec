import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { createDraftVoSchema } from "@/shared/lib/zod/schemas/prompt/draft";

// # 单条草稿详情：编辑时拉取完整内容（列表只返回截断预览）

// > 按 id 获取草稿全文（where 含 ownerId 防止越权读取他人草稿）
export const GET = withPersonal(
	async ({ ctx, session }) => {
		const { id: rawId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;

		const draft = await prisma.promptDraft.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				content: true,
				folderId: true,
				ownerId: true,
				updatedAt: true,
			},
		});

		// 草稿不存在或不是当前用户所有，统一返回 404（避免暴露资源归属）
		if (!draft || draft.ownerId !== session.user.id) {
			throw new AiSpecError({ code: "NOT_FOUND", message: "草稿不存在" });
		}

		// folderId null → undefined（前端约定）
		const out = {
			...draft,
			folderId: draft.folderId ?? undefined,
			updatedAt: draft.updatedAt.toISOString(),
		};
		const result = createDraftVoSchema.safeParse(out);
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptDraft.read"] },
);
