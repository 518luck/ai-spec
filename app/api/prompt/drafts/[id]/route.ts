import { NextResponse } from "next/server";

import { AiSpecError } from "@/server/errors/http-error";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import {
	createDraftVoSchema,
	deleteDraftDtoSchema,
	draftContentVoSchema,
	updateDraftDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/draft";

// # 单条草稿详情 / 删除：按 id 拉取全文或硬删除，归属隔离统一走 ownerId 进 where

// > 按 id 获取草稿全文（where 含 ownerId 防止越权读取他人草稿）
export const GET = withPersonal(
	async ({ ctx, session }) => {
		const { id: rawId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;

		const draft = await prisma.promptDraft.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				content: true,
				folderId: true,
				ownerId: true,
			},
		});

		// 草稿不存在或不是当前用户所有，统一返回 404（避免暴露资源归属）
		if (!draft || draft.ownerId !== session.user.id) {
			throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "草稿不存在" });
		}

		// ownerId 仅用于权限校验，不返回给前端；folderId 直接透传 null（VO schema 已为 nullable）
		const { ownerId: _ownerId, ...rest } = draft;
		const result = draftContentVoSchema.safeParse(rest);
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptDraft.read"] },
);

// > 部分更新草稿：id 走路径，body 字段全部可选；where 含 ownerId 防止越权修改他人草稿
export const PATCH = withPersonal(
	async ({ req, ctx, session }) => {
		const { id: rawId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;

		const parsed = updateDraftDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}
		const { name, content, images, folderId } = parsed.data;

		// 构建部分更新数据：只更新传入的字段
		const data: Record<string, unknown> = {};
		if (name !== undefined) data.name = name;
		if (content !== undefined) data.content = content;
		if (images !== undefined) data.images = images;
		if (folderId !== undefined) data.folderId = folderId || null;

		// ownerId 进 where 做归属隔离；记录不存在或不属于当前用户时抛 P2025 → 404
		const updated = await prisma.promptDraft.update({
			where: { id, ownerId: session.user.id },
			data,
			select: { id: true, name: true, content: true, folderId: true, updatedAt: true },
		});

		// updatedAt 由 Date 转 ISO 字符串，folderId 直接透传 null（VO schema 已为 nullable）
		const result = createDraftVoSchema.safeParse({
			...updated,
			updatedAt: updated.updatedAt.toISOString(),
		});
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptDraft.write"] },
);

// > 硬删除草稿：where 含 ownerId，删除他人草稿时 Prisma P2025 自动映射为 404，不暴露归属
export const DELETE = withPersonal(
	async ({ ctx, session }) => {
		const { id: rawId } = await ctx.params;
		const id = Array.isArray(rawId) ? rawId[0] : rawId;

		// 路径参数守卫：id 非空才放行
		const parsed = deleteDraftDtoSchema.safeParse({ id });
		if (!parsed.success) {
			throw parsed.error;
		}

		// ownerId 进 where 做归属隔离；记录不存在或不属于当前用户时抛 P2025 → 404
		await prisma.promptDraft.delete({
			where: { id: parsed.data.id, ownerId: session.user.id },
		});

		return NextResponse.json({ success: true });
	},
	{ permissions: ["promptDraft.write"] },
);
