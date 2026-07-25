import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { ruleVoSchema } from "@/shared/lib/zod/schemas/rule";

// # 单条规约：查看详情、更新、删除

// 获取单条规约详情
export const GET = withPersonal(async ({ ctx, session }) => {
	const { id: rawId } = await ctx.params;
	const id = Array.isArray(rawId) ? rawId[0] : rawId;

	const rule = await prisma.rule.findFirst({
		where: {
			id,
			ownerId: session.user.id,
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

	if (!rule) {
		return NextResponse.json(
			{ error: { message: "规约不存在" } },
			{ status: 404 },
		);
	}

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

	return NextResponse.json(result.data);
});

// 更新规约
export const PUT = withPersonal(async ({ req, ctx, session }) => {
	const { id: rawId } = await ctx.params;
	const id = Array.isArray(rawId) ? rawId[0] : rawId;
	const body = await req.json();

	// 验证规约是否存在且属于当前用户
	const existingRule = await prisma.rule.findFirst({
		where: {
			id,
			ownerId: session.user.id,
		},
	});

	if (!existingRule) {
		return NextResponse.json(
			{ error: { message: "规约不存在" } },
			{ status: 404 },
		);
	}

	// 更新规约
	const rule = await prisma.rule.update({
		where: { id },
		data: {
			name: body.name ?? existingRule.name,
			content: body.content ?? existingRule.content,
			folderId: body.folderId !== undefined ? (body.folderId || null) : existingRule.folderId,
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

	return NextResponse.json(result.data);
});

// 删除规约
export const DELETE = withPersonal(async ({ ctx, session }) => {
	const { id: rawId } = await ctx.params;
	const id = Array.isArray(rawId) ? rawId[0] : rawId;

	// 验证规约是否存在且属于当前用户
	const existingRule = await prisma.rule.findFirst({
		where: {
			id,
			ownerId: session.user.id,
		},
	});

	if (!existingRule) {
		return NextResponse.json(
			{ error: { message: "规约不存在" } },
			{ status: 404 },
		);
	}

	// 删除规约
	await prisma.rule.delete({
		where: { id },
	});

	return NextResponse.json({ success: true });
});
