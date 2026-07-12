import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { createFolderDtoSchema } from "@/shared/lib/zod/schemas/folder";

// 获取当前用户的个人空间文件夹列表（team_id=null），按 sort_order 和创建时间排序
export const GET = withPersonal(async ({ session }) => {
	const folders = await prisma.folder.findMany({
		where: { owner_id: session.user.id, team_id: null },
		orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
		select: { id: true, name: true, color: true },
	});

	// 转成 FolderCombobox 所需的 { value, label, color } 形状
	return NextResponse.json(
		folders.map((f) => ({ value: f.id, label: f.name, color: f.color ?? undefined })),
	);
});

// 在当前用户的个人空间新建文件夹
export const POST = withPersonal(async ({ req, session }) => {
	const parsed = createFolderDtoSchema.safeParse(await req.json());
	if (!parsed.success) {
		throw parsed.error;
	}

	const folder = await prisma.folder.create({
		data: {
			name: parsed.data.name,
			owner_id: session.user.id,
			team_id: null,
		},
		select: { id: true, name: true, color: true },
	});

	return NextResponse.json(
		{ value: folder.id, label: folder.name, color: folder.color ?? undefined },
		{ status: 201 },
	);
});
