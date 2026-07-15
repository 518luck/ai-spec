import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import {
	createFolderDtoSchema,
	folderListVoSchema,
	folderOptionVoSchema,
} from "@/shared/lib/zod/schemas/folder";

// # 个人空间文件夹：列表查询与新建（teamId 始终为 null）

// 获取个人空间文件夹列表，按资源类型过滤，按 sortOrder 和创建时间排序
export const GET = withPersonal(async ({ session, searchParams }) => {
	const { type } = searchParams;
	const folders = await prisma.folder.findMany({
		where: { ownerId: session.user.id, teamId: null, ...(type && { resourceType: type }) },
		orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
		select: { id: true, name: true, color: true, resourceType: true },
	});

	// 映射 resource_type → resourceType（业务命名），返回前经 Vo schema 校验
	const list = folders.map((f) => ({
		id: f.id,
		name: f.name,
		color: f.color,
		resourceType: f.resourceType,
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
			color: parsed.data.color,
			resourceType: parsed.data.resourceType,
			ownerId: session.user.id,
			teamId: null,
		},
		select: { id: true, name: true, color: true, resourceType: true },
	});

	// 映射 resource_type → resourceType（业务命名），返回前经 Vo schema 校验
	const out = {
		id: folder.id,
		name: folder.name,
		color: folder.color,
		resourceType: folder.resourceType,
	};
	const result = folderOptionVoSchema.safeParse(out);
	if (!result.success) {
		throw result.error;
	}

	return NextResponse.json(result.data, { status: 201 });
});
