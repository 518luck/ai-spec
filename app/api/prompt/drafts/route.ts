import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { createDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";
// 创建提示词草稿：校验入参后以 session.user.id 为 owner 写入 PromptDraft；API Key 接入需 promptDraft.write 权限
export const POST = withPersonal(
	async ({ req, session }) => {
		const parsed = createDraftDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}
		const { name, description, content, images } = parsed.data;

		const draft = await prisma.promptDraft.create({
			data: {
				name: name || null,
				description: description || null,
				content,
				images,
				owner_id: session.user.id,
			},
			select: {
				id: true,
				name: true,
				content: true,
				updated_at: true,
			},
		});

		return NextResponse.json(draft, { status: 201 });
	},
	{ permissions: ["promptDraft.write"] },
);
