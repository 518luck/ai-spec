import { NextResponse } from "next/server";

import { PAGE_SIZE } from "@/pages/spec/personal/prompt/drafts/config/draft-list";
import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { createDraftDtoSchema } from "@/shared/lib/zod/schemas/prompt/draft";

// # 提示词草稿：列表查询 + 创建（API Key 接入需 promptDraft.read / .write 权限）

// > 按搜索/排序/文件夹查询当前用户草稿（分页），返回 { data, total }
export const GET = withPersonal(
	async ({ session, searchParams }) => {
		const { query, sort, folder } = searchParams;
		const trimmedQuery = query?.trim() ?? "";

		// 组合查询条件：owner_id 必有；有文件夹时加 folder_id 筛选；有搜索词时加模糊匹配
		const where = {
			owner_id: session.user.id,
			...(folder && { folder_id: folder }),
			...(trimmedQuery && {
				OR: [
					{ name: { contains: trimmedQuery, mode: "insensitive" as const } },
					{ content: { contains: trimmedQuery, mode: "insensitive" as const } },
				],
			}),
		};

		// 排序映射：created→按创建时间倒序，其余→按更新时间倒序
		const orderBy =
			sort === "created" ? { created_at: "desc" as const } : { updated_at: "desc" as const };

		// findMany 取当前页草稿、count 取总数，两者无依赖并行查询以减少等待
		const [data, total] = await Promise.all([
			prisma.promptDraft.findMany({
				where,
				orderBy,
				take: PAGE_SIZE,
				select: { id: true, name: true, content: true, updated_at: true },
			}),
			prisma.promptDraft.count({ where }),
		]);

		return NextResponse.json({ data, total });
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
		const { name, content, images, folder_id } = parsed.data;

		const draft = await prisma.promptDraft.create({
			data: {
				name: name || null,
				content,
				images,
				owner_id: session.user.id,
				folder_id: folder_id || null,
			},
			select: {
				id: true,
				name: true,
				content: true,
				updated_at: true,
			},
		});

		return NextResponse.json(draft, { status: 201 });
	},
	{ permissions: ["promptDraft.write"] },
);
