import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import { mapTags } from "@/server/utils/map-tags";
import { getOrCreatePersonalRuleSpace, resolveRuleSpaceId } from "@/server/utils/rule-space";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import {
	createRuleDtoSchema,
	listRulesDtoSchema,
	ruleListVoSchema,
	ruleVoSchema,
} from "@/shared/lib/zod/schemas/rule";

// # 规约：列表查询（领域空间 + 文件夹 + 标签 + 搜索）+ 创建（个人空间）

// 分页大小
const PAGE_SIZE = 30;

// 列表预览的截断长度（字符数）
const PREVIEW_LENGTH = 120;

// > 按更新时间倒序查询当前用户规约（文件夹 + 标签 + 搜索筛选 + 分页）
export const GET = withPersonal(async ({ session, searchParams }) => {
	const parsed = listRulesDtoSchema.safeParse(searchParams);
	if (!parsed.success) {
		throw parsed.error;
	}
	const { folderId, spaceId, tagIds: tagIdsParam, q, offset = 0 } = parsed.data;
	const trimmedQuery = q?.trim() ?? "";

	// folderId 为空（空串/undefined）表示"未分类"，统一映射为 null 查询
	const targetFolderId = folderId || null;
	// tagIds 为逗号分隔字符串，解析成数组；为空表示不按标签筛选
	const tagIds = (tagIdsParam ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);

	// ! 领域空间是顶层隔离：没传 spaceId 时按个人默认空间查，绝不跨空间混列
	const targetSpaceId = spaceId ?? (await getOrCreatePersonalRuleSpace(session.user.id));

	// 构建查询条件
	const where = {
		ownerId: session.user.id,
		folderId: targetFolderId,
		spaceId: targetSpaceId,
		// 命中任一选中标签即返回（some 关系）
		...(tagIds.length > 0 && { tags: { some: { tagId: { in: tagIds } } } }),
		...(trimmedQuery && {
			OR: [
				{ name: { contains: trimmedQuery, mode: "insensitive" as const } },
				{ content: { contains: trimmedQuery, mode: "insensitive" as const } },
			],
		}),
	};

	// 查询列表和总数
	const [rules, total] = await Promise.all([
		prisma.rule.findMany({
			where,
			orderBy: { updatedAt: "desc" },
			select: {
				id: true,
				name: true,
				content: true,
				folderId: true,
				folder: {
					select: {
						name: true,
					},
				},
				createdAt: true,
				updatedAt: true,
			},
			take: PAGE_SIZE,
			skip: offset,
		}),
		prisma.rule.count({ where }),
	]);

	// 截取预览内容
	const data = rules.map((rule) => ({
		id: rule.id,
		name: rule.name,
		preview:
			rule.content.length > PREVIEW_LENGTH
				? `${rule.content.substring(0, PREVIEW_LENGTH)}...`
				: rule.content,
		folderId: rule.folderId,
		folderName: rule.folder?.name ?? null,
		createdAt: rule.createdAt.toISOString(),
		updatedAt: rule.updatedAt.toISOString(),
	}));

	// 是否还有下一页
	const hasMore = rules.length === PAGE_SIZE;
	const nextOffset = hasMore ? offset + rules.length : undefined;

	// 经 Vo schema 校验
	const voResult = ruleListVoSchema.safeParse({
		data,
		total,
		hasMore,
		nextOffset,
	});
	if (!voResult.success) {
		throw voResult.error;
	}

	return NextResponse.json(voResult.data);
});

// > 校验入参后创建规约，空间归属跟随所选文件夹，未选文件夹时落到个人默认空间
export const POST = withPersonal(async ({ req, session }) => {
	const parsed = createRuleDtoSchema.safeParse(await req.json());
	if (!parsed.success) {
		throw parsed.error;
	}
	const { name, content, folderId, spaceId, tags } = parsed.data;
	const targetFolderId = folderId || null;

	// ! 规则的 spaceId 必须与所在文件夹的空间一致，否则规则会出现在文件夹之外的空间里
	const folder = targetFolderId
		? await prisma.folder.findFirst({
				where: { id: targetFolderId, ownerId: session.user.id },
				select: { ruleSpaceId: true },
			})
		: null;
	if (targetFolderId && !folder) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "文件夹不存在" });
	}

	const targetSpaceId =
		folder?.ruleSpaceId ?? (await resolveRuleSpaceId({ userId: session.user.id, spaceId }));

	const rule = await prisma.rule.create({
		data: {
			name,
			content,
			ownerId: session.user.id,
			spaceId: targetSpaceId,
			folderId: targetFolderId,
			// 标签关联：tags 为 id 数组，直接 create 关联表行；id 不存在时外键约束抛 P2025
			tags: { create: (tags ?? []).map((tagId) => ({ tagId })) },
		},
		select: {
			id: true,
			name: true,
			content: true,
			folderId: true,
			tags: { include: { tag: true } },
			createdAt: true,
			updatedAt: true,
		},
	});

	// 转换时间格式 + 扁平化标签关联
	const out = {
		...rule,
		tags: mapTags(rule.tags),
		createdAt: rule.createdAt.toISOString(),
		updatedAt: rule.updatedAt.toISOString(),
	};

	const result = ruleVoSchema.safeParse(out);
	if (!result.success) {
		throw result.error;
	}

	return NextResponse.json(result.data, { status: 201 });
});
