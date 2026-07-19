import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { Prisma } from "@/shared/db/generator/client";
import type { RecordVo } from "@/shared/lib/zod/schemas/prompt/record";
import {
	createRecordDtoSchema,
	createRecordVoSchema,
	listRecordsDtoSchema,
	recordListVoSchema,
	updateRecordDtoSchema,
} from "@/shared/lib/zod/schemas/prompt/record";

// # 提示词收录：列表查询 + 创建（API Key 接入需 promptRecord.read / .write 权限）

// 分页大小，由列表接口固定，前端不控制
const PAGE_SIZE = 30;

// 列表预览的截断长度（字符数），列表接口不返回 content 全文
const PREVIEW_LENGTH = 120;

// > 按更新时间倒序查询当前用户收录（按文件夹筛选 + 分页），返回 { data, total }
export const GET = withPersonal(
	async ({ session, searchParams }) => {
		const parsed = listRecordsDtoSchema.safeParse(searchParams);
		if (!parsed.success) {
			throw parsed.error;
		}
		const { folderId, offset = 0 } = parsed.data;

		// folderId 为空（空串/undefined）表示"未分类"，统一映射为 null 查询
		const targetFolderId = folderId || null;
		// 列表按 owner + folderId 筛选；Prisma where 给 count 用，raw SQL where 给列表预览截断用，两者必须同步
		const where: Prisma.PromptRecordWhereInput = {
			ownerId: session.user.id,
			folderId: targetFolderId,
		};
		const whereSql = Prisma.sql`WHERE owner_id = ${session.user.id} AND folder_id ${
			targetFolderId ? Prisma.sql`= ${targetFolderId}` : Prisma.sql`IS NULL`
		}`;
		const orderBySql = Prisma.sql`ORDER BY updated_at DESC`;

		// 列表用原生查询在数据库层截取 preview；count 仍用 Prisma 安全计数
		const [rows, total] = await Promise.all([
			prisma.$queryRaw<RecordVo[]>`
				SELECT id, name, SUBSTRING(content, 1, ${PREVIEW_LENGTH}) AS preview
				FROM prompt."PromptRecord"
				${whereSql}
				${orderBySql}
				LIMIT ${PAGE_SIZE}
				OFFSET ${offset}
			`,
			prisma.promptRecord.count({ where }),
		]);

		// 是否还有下一页：本次返回满一页（=PAGE_SIZE）说明数据库可能还有更多，认为 hasMore=true；不足一页说明到底了
		const hasMore = rows.length === PAGE_SIZE;
		// 下一页起点：有下一页时，用"当前起点 + 本次实际返回条数"算出下一页的 offset；到底了则不提供
		const nextOffset = hasMore ? offset + rows.length : undefined;

		// 经 Vo schema 校验，确保响应形状与前端类型一致
		const voResult = recordListVoSchema.safeParse({ data: rows, total, hasMore, nextOffset });
		if (!voResult.success) {
			throw voResult.error;
		}

		return NextResponse.json(voResult.data);
	},
	{ permissions: ["promptRecord.read"] },
);

// > 校验入参后以 session.user.id 为 owner 写入 PromptRecord；visibility 默认私有，创建时不暴露进 Dto
export const POST = withPersonal(
	async ({ req, session }) => {
		const parsed = createRecordDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}
		const { name, content, images, folderId } = parsed.data;

		const record = await prisma.promptRecord.create({
			data: {
				name,
				content,
				images,
				ownerId: session.user.id,
				folderId: folderId || null,
				visibility: "private",
			},
			select: {
				id: true,
				name: true,
				content: true,
				visibility: true,
				folderId: true,
				updatedAt: true,
			},
		});

		// updatedAt 由 Date 转 ISO 字符串，folderId null → undefined，后经 Vo schema 校验
		const out = {
			...record,
			folderId: record.folderId ?? undefined,
			updatedAt: record.updatedAt.toISOString(),
		};
		const result = createRecordVoSchema.safeParse(out);
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data, { status: 201 });
	},
	{ permissions: ["promptRecord.write"] },
);

// > 校验入参后更新收录（where 含 ownerId 防止越权修改他人收录）；不写版本快照，后续接入版本管理时再补
export const PATCH = withPersonal(
	async ({ req, session }) => {
		const parsed = updateRecordDtoSchema.safeParse(await req.json());
		if (!parsed.success) {
			throw parsed.error;
		}
		const { id, name, content, images, folderId } = parsed.data;

		// 构建部分更新数据：只更新传入的字段
		const data: Record<string, unknown> = {};
		if (name !== undefined) data.name = name;
		if (content !== undefined) data.content = content;
		if (images !== undefined) data.images = images;
		if (folderId !== undefined) data.folderId = folderId || null;

		const updated = await prisma.promptRecord.update({
			where: { id, ownerId: session.user.id },
			data,
			select: {
				id: true,
				name: true,
				content: true,
				visibility: true,
				folderId: true,
				updatedAt: true,
			},
		});

		// updatedAt 由 Date 转 ISO 字符串，folderId null → undefined，后经 Vo schema 校验
		const out = {
			...updated,
			folderId: updated.folderId ?? undefined,
			updatedAt: updated.updatedAt.toISOString(),
		};
		const result = createRecordVoSchema.safeParse(out);
		if (!result.success) {
			throw result.error;
		}

		return NextResponse.json(result.data);
	},
	{ permissions: ["promptRecord.write"] },
);
