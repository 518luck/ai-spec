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
} from "@/shared/lib/zod/schemas/prompt/record";

// # 提示词收录：列表查询 + 创建（API Key 接入需 promptRecord.read / .write 权限）

// 分页大小，由列表接口固定，前端不控制
const PAGE_SIZE = 30;

// 列表预览的截断长度（字符数），列表接口不返回 content 全文
const PREVIEW_LENGTH = 120;

// > 按更新时间倒序查询当前用户收录（仅分页，无搜索/文件夹筛选），返回 { data, total }
export const GET = withPersonal(
	async ({ session, searchParams }) => {
		const parsed = listRecordsDtoSchema.safeParse(searchParams);
		if (!parsed.success) {
			throw parsed.error;
		}
		const { offset = 0 } = parsed.data;

		// 列表仅按 owner 隔离；查询条件简单，直接用 Prisma where 配合原生查询做预览截断
		const where: Prisma.PromptRecordWhereInput = { ownerId: session.user.id };
		const whereSql = Prisma.sql`WHERE owner_id = ${session.user.id}`;
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

		// 是否还有下一页：本次返回满一页则认为还有
		const hasMore = rows.length === PAGE_SIZE;
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
