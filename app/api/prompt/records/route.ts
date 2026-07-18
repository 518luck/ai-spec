import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import {
	createRecordDtoSchema,
	createRecordVoSchema,
} from "@/shared/lib/zod/schemas/prompt/record";

// # 提示词收录：创建（API Key 接入需 promptRecord.write 权限）

// > 校验入参后以 session.user.id 为 owner 写入 PromptRecord；visibility 默认私有，创建时不暴露进 Dto
export const POST = withPersonal(
	async ({ req, session }) => {
		const parsed = createRecordDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}
		const { name, content, images, folderId } = parsed.data;

		const record = await prisma.promptRecord.create({
			data: {
				name,
				content,
				images,
				ownerId: session.user.id,
				folderId: folderId || null,
				visibility: "private",
			},
			select: {
				id: true,
				name: true,
				content: true,
				visibility: true,
				folderId: true,
				updatedAt: true,
			},
		});

		// updatedAt 由 Date 转 ISO 字符串，folderId null → undefined，后经 Vo schema 校验
		const out = {
			...record,
			folderId: record.folderId ?? undefined,
			updatedAt: record.updatedAt.toISOString(),
		};
		const result = createRecordVoSchema.safeParse(out);
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data, { status: 201 });
	},
	{ permissions: ["promptRecord.write"] },
);
