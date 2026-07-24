import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import prisma from "@/shared/db";
import { Prisma } from "@/shared/db/generator/client";
import { decodeFilters } from "@/shared/lib/search-filter";
import type { RecordVo } from "@/shared/lib/zod/schemas/prompt/record";
import {
	createRecordDtoSchema,
	createRecordVoSchema,
	listRecordsDtoSchema,
	recordListVoSchema,
} from "@/shared/lib/zod/schemas/prompt/record";
import { mapTags } from "./lib/map-tags";

// # 提示词收录：列表查询（文件夹 + 标签 + 搜索）+ 创建（API Key 接入需 promptRecord.read / .write 权限）

// 分页大小，由列表接口固定，前端不控制
const PAGE_SIZE = 30;

// 列表预览的截断长度（字符数），列表接口不返回 content 全文
const PREVIEW_LENGTH = 120;

// > 按更新时间倒序查询当前用户收录（文件夹 + 标签 + 搜索筛选 + 分页），返回 { data, total }
export const GET = withPersonal(
	async ({ session, searchParams }) => {
		const parsed = listRecordsDtoSchema.safeParse(searchParams);
		if (!parsed.success) {
			throw parsed.error;
		}
		const {
			folderId,
			tagIds: tagIdsParam,
			q,
			filter: filterEncoded,
			favorite,
			sort,
			offset = 0,
		} = parsed.data;
		const trimmedQuery = q?.trim() ?? "";

		// > 解析搜索字段开关：filter 为 base64 JSON（{title:true,content:true}）；解码失败或无 filter 参数时默认只搜 name
		const filter = decodeFilters(filterEncoded) ?? { title: true };
		const searchTitle = filter.title === true;
		const searchContent = filter.content === true;

		// folderId 为空（空串/undefined）表示"未分类"，统一映射为 null 查询
		const targetFolderId = folderId || null;
		// tagIds 为逗号分隔字符串，解析成数组；为空表示不按标签筛选
		const tagIds = (tagIdsParam ?? "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);

		// 按开关动态拼搜索条件（给 count 的 Prisma where 用）
		const searchConditions: Prisma.PromptRecordWhereInput[] = [];
		if (trimmedQuery && searchTitle) {
			searchConditions.push({ name: { contains: trimmedQuery, mode: "insensitive" } });
		}
		if (trimmedQuery && searchContent) {
			searchConditions.push({ content: { contains: trimmedQuery, mode: "insensitive" } });
		}
		// > 收藏筛选优先于文件夹：favorite=true 时跨文件夹返回当前用户收藏的收录（忽略 folderId）
		const isFavoriteMode = favorite === true;
		// 列表按 owner + folderId + tagIds 筛选；Prisma where 给 count 用，raw SQL where 给列表预览截断用，两者必须同步
		const where: Prisma.PromptRecordWhereInput = {
			ownerId: session.user.id,
			...(isFavoriteMode
				? { favoritedBy: { some: { userId: session.user.id } } }
				: { folderId: targetFolderId }),
			...(tagIds.length > 0 && { tags: { some: { tagId: { in: tagIds } } } }),
			...(searchConditions.length > 0 && { OR: searchConditions }),
		};

		// 构造 SQL WHERE 片段（Prisma 的 select 不支持字符串截断，用原生查询在数据库层完成）
		const whereConditions: Prisma.Sql[] = [Prisma.sql`owner_id = ${session.user.id}`];
		if (isFavoriteMode) {
			// > 收藏筛选：EXISTS 子查询匹配 PromptFavorite，忽略 folder_id
			whereConditions.push(
				Prisma.sql`EXISTS(SELECT 1 FROM prompt."PromptFavorite" pf WHERE pf.record_id = prompt."PromptRecord".id AND pf.user_id = ${session.user.id})`,
			);
		} else {
			whereConditions.push(
				targetFolderId ? Prisma.sql`folder_id = ${targetFolderId}` : Prisma.sql`folder_id IS NULL`,
			);
		}
		// > tag 多对多筛选：EXISTS 子查询避免 JOIN 产生重复行（一条 record 挂多个 tag 时不会被计多次）
		if (tagIds.length > 0) {
			whereConditions.push(
				Prisma.sql`EXISTS(SELECT 1 FROM prompt."PromptRecordTag" prt WHERE prt.record_id = prompt."PromptRecord".id AND prt.tag_id IN (${Prisma.join(
					tagIds,
				)}))`,
			);
		}
		// > raw SQL 按同样开关拼搜索条件（必须和上面 Prisma where 同步，否则 total 和列表对不上）
		if (trimmedQuery) {
			const pattern = `%${trimmedQuery}%`;
			const sqlParts: Prisma.Sql[] = [];
			if (searchTitle) sqlParts.push(Prisma.sql`name ILIKE ${pattern}`);
			if (searchContent) sqlParts.push(Prisma.sql`content ILIKE ${pattern}`);
			if (sqlParts.length === 1) {
				whereConditions.push(sqlParts[0]);
			} else if (sqlParts.length > 1) {
				whereConditions.push(Prisma.sql`(${Prisma.join(sqlParts, " OR ")})`);
			}
		}
		const whereSql = Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`;
		// > 排序：mostCopied 走 HN 幂律热度公式 copy_count / (age+2)^1.8，鼓励持续使用、老内容自然下沉
		// ! age 基于 last_copied_at（参考 Stack Overflow QupdatedInHours 设计）：每次复制刷新 age，持续使用的 prompt 保持靠前
		// ! NULLS LAST 把从未复制过的记录沉到底部；id 作为最终 tie-breaker 避免分页重复
		const orderBySql =
			sort === "mostCopied"
				? Prisma.sql`ORDER BY copy_count / POW(EXTRACT(EPOCH FROM (NOW() - last_copied_at)) / 3600 + 2, 1.8) DESC NULLS LAST, last_copied_at DESC NULLS LAST, id ASC`
				: Prisma.sql`ORDER BY updated_at DESC, id ASC`;

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

		// > 批量查当前页收录的收藏状态：一次性 IN 查询避免 N+1，映射到每行 favorite 字段
		const rowIds = rows.map((r) => r.id);
		const favoritedRows =
			rowIds.length > 0
				? await prisma.promptFavorite.findMany({
						where: { userId: session.user.id, recordId: { in: rowIds } },
						select: { recordId: true },
					})
				: [];
		const favoritedSet = new Set(favoritedRows.map((f) => f.recordId));
		const rowsWithFavorite = rows.map((r) => ({ ...r, favorite: favoritedSet.has(r.id) }));

		// 是否还有下一页：本次返回满一页（=PAGE_SIZE）说明数据库可能还有更多，认为 hasMore=true；不足一页说明到底了
		const hasMore = rows.length === PAGE_SIZE;
		// 下一页起点：有下一页时，用"当前起点 + 本次实际返回条数"算出下一页的 offset；到底了则不提供
		const nextOffset = hasMore ? offset + rows.length : undefined;

		// 经 Vo schema 校验，确保响应形状与前端类型一致
		const voResult = recordListVoSchema.safeParse({
			data: rowsWithFavorite,
			total,
			hasMore,
			nextOffset,
		});
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
		const { name, content, images, folderId, tags } = parsed.data;

		const record = await prisma.promptRecord.create({
			data: {
				name,
				content,
				images,
				ownerId: session.user.id,
				folderId: folderId || null,
				visibility: "private",
				// 标签关联：tags 为 id 数组，直接 create 关联表行；id 不存在时外键约束抛 P2025
				tags: { create: (tags ?? []).map((tagId) => ({ tagId })) },
				// 创建初始版本（v1 快照），保证版本历史至少有一条记录
				versions: {
					create: {
						versionNumber: 1,
						message: "初始版本",
						isSnapshot: true,
						snapshot: content,
						editorId: session.user.id,
					},
				},
			},
			select: {
				id: true,
				name: true,
				content: true,
				visibility: true,
				folderId: true,
				tags: { include: { tag: true } },
				updatedAt: true,
			},
		});

		// updatedAt 由 Date 转 ISO 字符串，folderId 直接透传 null；tags 关联记录映射为扁平 {id,name,color} 数组
		const out = {
			...record,
			tags: mapTags(record.tags),
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
