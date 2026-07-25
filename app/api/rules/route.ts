import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import {
	createRuleDtoSchema,
	listRulesDtoSchema,
	ruleListVoSchema,
	ruleVoSchema,
} from "@/shared/lib/zod/schemas/rule";

// # 规约：列表查询（文件夹 + 搜索）+ 创建（个人空间）

// 分页大小
const PAGE_SIZE = 30;

// 列表预览的截断长度（字符数）
const PREVIEW_LENGTH = 120;

// 获取或创建用户的个人规则空间（teamId=null）
const getOrCreatePersonalSpace = async (userId: string): Promise<string> => {
	const existingSpace = await prisma.ruleSpace.findFirst({
		where: { ownerId: userId, teamId: null },
		select: { id: true },
	});

	if (existingSpace) {
		return existingSpace.id;
	}

	// 个人空间不存在，自动创建默认空间
	const newSpace = await prisma.ruleSpace.create({
		data: {
			name: "我的规约",
			icon: "rules",
			ownerId: userId,
			teamId: null,
		},
		select: { id: true },
	});

	return newSpace.id;
};

// > 按更新时间倒序查询当前用户规约（文件夹 + 搜索筛选 + 分页）
export const GET = withPersonal(async ({ session, searchParams }) => {
	const parsed = listRulesDtoSchema.safeParse(searchParams);
	if (!parsed.success) {
		throw parsed.error;
	}
	const { folderId, q, offset = 0 } = parsed.data;
	const trimmedQuery = q?.trim() ?? "";

	// folderId 为空（空串/undefined）表示"未分类"，统一映射为 null 查询
	const targetFolderId = folderId || null;

	// 构建查询条件
	const where = {
		ownerId: session.user.id,
		folderId: targetFolderId,
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

// > 校验入参后创建规约，自动关联用户的个人空间
export const POST = withPersonal(async ({ req, session }) => {
	const parsed = createRuleDtoSchema.safeParse(await req.json());
	if (!parsed.success) {
		throw parsed.error;
	}
	const { name, content, folderId } = parsed.data;

	// 获取或创建用户的个人规则空间
	const spaceId = await getOrCreatePersonalSpace(session.user.id);

	const rule = await prisma.rule.create({
		data: {
			name,
			content,
			ownerId: session.user.id,
			spaceId,
			folderId: folderId || null,
		},
		select: {
			id: true,
			name: true,
			content: true,
			folderId: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	// 转换时间格式
	const out = {
		...rule,
		createdAt: rule.createdAt.toISOString(),
		updatedAt: rule.updatedAt.toISOString(),
	};

	const result = ruleVoSchema.safeParse(out);
	if (!result.success) {
		throw result.error;
	}

	return NextResponse.json(result.data, { status: 201 });
});
