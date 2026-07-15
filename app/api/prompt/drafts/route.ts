import { NextResponse } from "next/server";

import { PAGE_SIZE } from "@/pages/spec/personal/prompt/drafts/config/draft-list";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import {
	createDraftDtoSchema,
	createDraftVoSchema,
	draftListVoSchema,
	listDraftsDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/draft";

// # 提示词草稿：列表查询 + 创建（API Key 接入需 promptDraft.read / .write 权限）

// > 按搜索/排序/文件夹查询当前用户草稿（分页），返回 { data, total }
export const GET = withPersonal(
	async ({ session, searchParams }) => {
		const parsed = listDraftsDtoSchema.safeParse(searchParams);
		if (!parsed.success) {
			throw parsed.error;
		}
		const { query, sort, folderId } = parsed.data;
		const trimmedQuery = query?.trim() ?? "";

		// 组合查询条件：ownerId 必有；有文件夹时加 folderId 筛选；有搜索词时加模糊匹配
		const where = {
			ownerId: session.user.id,
			...(folderId && { folderId }),
			...(trimmedQuery && {
				OR: [
					{ name: { contains: trimmedQuery, mode: "insensitive" as const } },
					{ content: { contains: trimmedQuery, mode: "insensitive" as const } },
				],
			}),
		};

		// 排序映射：created→按创建时间倒序，其余→按更新时间倒序
		const orderBy =
			sort === "created" ? { createdAt: "desc" as const } : { updatedAt: "desc" as const };

		// findMany 取当前页草稿、count 取总数，两者无依赖并行查询以减少等待
		const [rows, total] = await Promise.all([
			prisma.promptDraft.findMany({
				where,
				orderBy,
				take: PAGE_SIZE,
				select: { id: true, name: true, content: true, updatedAt: true },
			}),
			prisma.promptDraft.count({ where }),
		]);

		// updatedAt 由 Date 转 ISO 字符串后经 Vo schema 校验，确保响应形状与前端类型一致
		const list = rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
		const voResult = draftListVoSchema.safeParse({ data: list, total });
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
				updatedAt: true,
			},
		});

		// updatedAt 由 Date 转 ISO 字符串后经 Vo schema 校验，确保响应形状与前端类型一致
		const out = { ...draft, updatedAt: draft.updatedAt.toISOString() };
		const result = createDraftVoSchema.safeParse(out);
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data, { status: 201 });
	},
	{ permissions: ["promptDraft.write"] },
);
