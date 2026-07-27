import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import { getOrCreatePersonalRuleSpace, resolveRuleSpaceId } from "@/server/utils/rule-space";
import prisma from "@/shared/db";
import {
	createFolderDtoSchema,
	folderListVoSchema,
	folderOptionVoSchema,
} from "@/shared/lib/zod/schemas/folder";

// # 个人空间文件夹：列表查询与新建（teamId 始终为 null）

// 规约文件夹的资源类型：这类文件夹必须挂在规约领域空间下，其余资源类型的文件夹与空间无关
const RULE_RESOURCE_TYPE = "rules";

// 获取个人空间文件夹列表，按资源类型 + 领域空间过滤，按 sortOrder 和创建时间排序
export const GET = withPersonal(async ({ session, searchParams }) => {
	const { type, spaceId } = searchParams;

	// ! 规约文件夹按领域空间隔离：没传 spaceId 时收敛到个人默认空间，绝不跨空间混列
	const ruleSpaceId =
		type === RULE_RESOURCE_TYPE
			? (spaceId ?? (await getOrCreatePersonalRuleSpace(session.user.id)))
			: null;

	const folders = await prisma.folder.findMany({
		where: {
			ownerId: session.user.id,
			teamId: null,
			...(type && { resourceType: type }),
			...(ruleSpaceId && { ruleSpaceId }),
		},
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
	const { name, description, color, resourceType, spaceId } = parsed.data;

	// > 规约文件夹的领域空间归属：没传 spaceId 时回落个人默认空间；其他资源类型不参与空间分层
	const ruleSpaceId =
		resourceType === RULE_RESOURCE_TYPE
			? await resolveRuleSpaceId({ userId: session.user.id, spaceId })
			: null;

	const folder = await prisma.folder.create({
		data: {
			name,
			description: description || null,
			color,
			resourceType,
			ownerId: session.user.id,
			teamId: null,
			ruleSpaceId,
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
