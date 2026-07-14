import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import {
	createFolderDtoSchema,
	folderListVoSchema,
	folderOptionVoSchema,
} from "@/shared/lib/zod/schemas/folder";

// # 个人空间文件夹：列表查询与新建（team_id 始终为 null）

// 获取个人空间文件夹列表，按资源类型过滤，按 sort_order 和创建时间排序
export const GET = withPersonal(async ({ session, searchParams }) => {
	const { type } = searchParams;
	const folders = await prisma.folder.findMany({
		where: { owner_id: session.user.id, team_id: null, ...(type && { resource_type: type }) },
		orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
		select: { id: true, name: true, color: true, resource_type: true },
	});

	// 直接返回数据库字段名，前端自行映射 UI 所需的 value/label
	// 返回前经 Vo schema 校验，确保响应形状与前端类型一致
	const list = folders.map((f) => ({
		id: f.id,
		name: f.name,
		color: f.color ?? undefined,
		resource_type: f.resource_type,
	}));
	const parsed = folderListVoSchema.safeParse(list);
	if (!parsed.success) {
		throw parsed.error;
	}

	return NextResponse.json(parsed.data);
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
			resource_type: parsed.data.resourceType,
			owner_id: session.user.id,
			team_id: null,
		},
		select: { id: true, name: true, color: true, resource_type: true },
	});

	// 返回前经 Vo schema 校验，确保响应形状与前端类型一致
	const out = {
		id: folder.id,
		name: folder.name,
		color: folder.color ?? undefined,
		resource_type: folder.resource_type,
	};
	const result = folderOptionVoSchema.safeParse(out);
	if (!result.success) {
		throw result.error;
	}

	return NextResponse.json(result.data, { status: 201 });
});
