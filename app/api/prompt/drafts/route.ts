import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { createDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";

// # 提示词草稿：创建（API Key 接入需 promptDraft.write 权限）

// > 校验入参后以 session.user.id 为 owner 写入 PromptDraft
export const POST = withPersonal(
	async ({ req, session }) => {
		const parsed = createDraftDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}
		const { name, content, images, folder_id } = parsed.data;

		const draft = await prisma.promptDraft.create({
			data: {
				name: name || null,
				content,
				images,
				owner_id: session.user.id,
				folder_id: folder_id || null,
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
