import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { createFolderDtoSchema } from "@/shared/lib/zod/schemas/folder";

// # 个人空间文件夹：列表查询与新建（team_id 始终为 null）

// 获取个人空间文件夹列表，按资源类型过滤，按 sort_order 和创建时间排序
export const GET = withPersonal(async ({ session, searchParams }) => {
	const { type } = searchParams;
	const folders = await prisma.folder.findMany({
		where: { owner_id: session.user.id, team_id: null, ...(type && { resource_type: type }) },
		orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
		select: { id: true, name: true, color: true, resource_type: true },
	});

	// 转成 FolderCombobox 所需的 { value, label, color, resource_type } 形状
	return NextResponse.json(
		folders.map((f) => ({
			value: f.id,
			label: f.name,
			color: f.color ?? undefined,
			resource_type: f.resource_type,
		})),
	);
});

// 在个人空间新建文件夹
export const POST = withPersonal(async ({ req, session }) => {
	const parsed = createFolderDtoSchema.safeParse(await req.json());
	if (!parsed.success) {
		throw parsed.error;
	}

	const folder = await prisma.folder.create({
		data: {
			name: parsed.data.name,
			description: parsed.data.description || null,
			color: parsed.data.color || null,
			resource_type: parsed.data.resource_type,
			owner_id: session.user.id,
			team_id: null,
		},
		select: { id: true, name: true, color: true, resource_type: true },
	});

	return NextResponse.json(
		{
			value: folder.id,
			label: folder.name,
			color: folder.color ?? undefined,
			resource_type: folder.resource_type,
		},
		{ status: 201 },
	);
});
