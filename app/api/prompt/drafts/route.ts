import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { Prisma } from "@/shared/db/generator/client";
import type { DraftVo } from "@/shared/lib/zod/schemas/prompt/draft";
import {
	createDraftDtoSchema,
	createDraftVoSchema,
	draftListVoSchema,
	listDraftsDtoSchema,
	updateDraftDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/draft";

// # 提示词草稿：列表查询 + 创建（API Key 接入需 promptDraft.read / .write 权限）

// 分页大小，由列表接口固定，前端不控制
const PAGE_SIZE = 30;

// 列表预览的截断长度（字符数），列表接口不返回 content 全文
const PREVIEW_LENGTH = 120;

// > 按搜索/排序/文件夹查询当前用户草稿（分页），返回 { data, total }
export const GET = withPersonal(
	async ({ session, searchParams }) => {
		const parsed = listDraftsDtoSchema.safeParse(searchParams);
		if (!parsed.success) {
			throw parsed.error;
		}
		const { query, sort, folderId, offset = 0 } = parsed.data;
		const trimmedQuery = query?.trim() ?? "";

		// 组合查询条件：ownerId 必有；选了文件夹按 folderId 筛选，未选则只看未分类（folderId 为 null）
		const targetFolderId = folderId || null;
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

		// 构造 SQL WHERE 与 ORDER BY 片段（Prisma 的 select 不支持字符串截断，用原生查询在数据库层完成）
		const whereConditions = [
			Prisma.sql`owner_id = ${session.user.id}`,
			targetFolderId ? Prisma.sql`folder_id = ${targetFolderId}` : Prisma.sql`folder_id IS NULL`,
		];
		if (trimmedQuery) {
			const pattern = `%${trimmedQuery}%`;
			whereConditions.push(Prisma.sql`(name ILIKE ${pattern} OR content ILIKE ${pattern})`);
		}
		const whereSql = Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`;
		const orderBySql =
			sort === "created"
				? Prisma.sql`ORDER BY created_at DESC`
				: Prisma.sql`ORDER BY updated_at DESC`;

		// 列表用原生查询在数据库层截取 preview；count 仍用 Prisma 安全计数
		const [rows, total] = await Promise.all([
			prisma.$queryRaw<DraftVo[]>`
				SELECT id, name, SUBSTRING(content, 1, ${PREVIEW_LENGTH}) AS preview
				FROM prompt."PromptDraft"
				${whereSql}
				${orderBySql}
				LIMIT ${PAGE_SIZE}
				OFFSET ${offset}
			`,
			prisma.promptDraft.count({ where }),
		]);

		// 是否还有下一页：本次返回满一页则认为还有
		const hasMore = rows.length === PAGE_SIZE;
		const nextOffset = hasMore ? offset + rows.length : undefined;

		// 经 Vo schema 校验，确保响应形状与前端类型一致
		const voResult = draftListVoSchema.safeParse({ data: rows, total, hasMore, nextOffset });
		if (!voResult.success) {
			throw voResult.error;
		}

		return NextResponse.json(voResult.data);
	},
	{ permissions: ["promptDraft.read"] },
);

// > 校验入参后以 session.user.id 为 owner 写入 PromptDraft
export const POST = withPersonal(
	async ({ req, session }) => {
		const parsed = createDraftDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}
		const { name, content, images, folderId } = parsed.data;

		const draft = await prisma.promptDraft.create({
			data: {
				name: name || null,
				content,
				images,
				ownerId: session.user.id,
				folderId: folderId || null,
			},
			select: {
				id: true,
				name: true,
				content: true,
				folderId: true,
				updatedAt: true,
			},
		});

		// updatedAt 由 Date 转 ISO 字符串，folderId null → undefined，后经 Vo schema 校验
		const out = {
			...draft,
			folderId: draft.folderId ?? undefined,
			updatedAt: draft.updatedAt.toISOString(),
		};
		const result = createDraftVoSchema.safeParse(out);
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data, { status: 201 });
	},
	{ permissions: ["promptDraft.write"] },
);

// > 校验入参后更新草稿（where 含 ownerId 防止越权修改他人草稿）
export const PATCH = withPersonal(
	async ({ req, session }) => {
		const parsed = updateDraftDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}
		const { id, name, content, images, folderId } = parsed.data;

		// 构建部分更新数据：只更新传入的字段
		const data: Record<string, unknown> = {};
		if (name !== undefined) data.name = name || null;
		if (content !== undefined) data.content = content;
		if (images !== undefined) data.images = images;
		if (folderId !== undefined) data.folderId = folderId || null;

		const updated = await prisma.promptDraft.update({
			where: { id, ownerId: session.user.id },
			data,
			select: { id: true, name: true, content: true, folderId: true, updatedAt: true },
		});

		// updatedAt 由 Date 转 ISO 字符串，folderId null → undefined，后经 Vo schema 校验
		const out = {
			...updated,
			folderId: updated.folderId ?? undefined,
			updatedAt: updated.updatedAt.toISOString(),
		};
		const result = createDraftVoSchema.safeParse(out);
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptDraft.write"] },
);
