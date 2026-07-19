import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import {
	createTagDtoSchema,
	tagListVoSchema,
	tagOptionVoSchema,
} from "@/shared/lib/zod/schemas/tag";

// # 个人空间标签：列表查询与新建（按"用户 × 资源类型"隔离，teamId 始终为 null）
// ! 与 folders/route.ts 对称，团队空间待 defaultWorkspace 基础设施上线后接通

// > 查询当前用户的标签列表，按资源类型过滤；按 name 字母序返回
export const GET = withPersonal(async ({ session, searchParams }) => {
	const { type } = searchParams;
	const tags = await prisma.tag.findMany({
		// 个人空间：ownerId 隔离 + teamId 始终 null；type 可选，传了按资源类型过滤
		where: { ownerId: session.user.id, teamId: null, ...(type && { resourceType: type }) },
		orderBy: [{ name: "asc" }],
		select: { id: true, name: true, color: true, resourceType: true },
	});

	const parsed = tagListVoSchema.safeParse(tags);
	if (!parsed.success) {
		throw parsed.error;
	}

	return NextResponse.json(parsed.data);
});

// > 新建标签：同用户同团队同资源下 name 唯一，存在则复用并更新 color，不存在则新建
// ! teamId 当前写死 null（个人空间），与 folders/route.ts 一致
// ! 团队功能上线时不要从 session 自动推断 teamId——会让加入团队的用户无法再用个人空间
// ! 必须由前端显式传（用户在 UI 上选工作空间），后端校验用户是该团队成员
export const POST = withPersonal(async ({ req, session }) => {
	const parsed = createTagDtoSchema.safeParse(await req.json());
	if (!parsed.success) {
		throw parsed.error;
	}

	const { name, color, resourceType } = parsed.data;

	// 先查同用户同资源同名的标签是否存在（teamId=null = 个人空间）
	const existing = await prisma.tag.findFirst({
		where: { ownerId: session.user.id, teamId: null, resourceType, name },
		select: { id: true },
	});

	let tag: { id: string; name: string; color: string; resourceType: string };
	if (existing) {
		// 存在：复用 id，更新 color（同名标签的颜色以最新提交为准）
		tag = await prisma.tag.update({
			where: { id: existing.id },
			data: { color },
			select: { id: true, name: true, color: true, resourceType: true },
		});
	} else {
		// 不存在：新建（color 由 schema 保证必填，DB @default 作防御兜底）
		tag = await prisma.tag.create({
			data: {
				name,
				color,
				resourceType,
				ownerId: session.user.id,
				teamId: null,
			},
			select: { id: true, name: true, color: true, resourceType: true },
		});
	}

	const result = tagOptionVoSchema.safeParse(tag);
	if (!result.success) {
		throw result.error;
	}

	return NextResponse.json(result.data, { status: 201 });
});
