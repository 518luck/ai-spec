// # 收录列表查询：raw SQL 在数据库层截断 preview，HN 幂律排序（mostCopied）或 updatedAt 倒序（recent）
// ! Prisma where（给 count）与 raw SQL whereConditions（给列表）必须同步，否则 total 与列表对不上

import prisma from "@/shared/db";
import { Prisma } from "@/shared/db/generator/client";
import { decodeFilters } from "@/shared/lib/search-filter-codec";
import type { RecordListVo } from "@/shared/lib/zod/schemas/prompt/record";

// 分页大小，由列表接口固定，前端不控制
const PAGE_SIZE = 30;

// 列表预览的截断长度（字符数），列表接口不返回 content 全文
const PREVIEW_LENGTH = 120;

// 列表查询参数（与 listRecordsDtoSchema 对齐，已由 zod 校验保证类型）
type ListParams = {
	userId: string;
	folderId?: string;
	tagIds: string[];
	q?: string;
	filter?: string;
	favorite?: boolean;
	sort?: "recent" | "mostCopied";
	page: number;
};

// ! 规约收录按收藏/文件夹隔离：favorite=true 时跨文件夹返回当前用户收藏的收录（忽略 folderId）
export const listRecords = async ({
	userId,
	folderId,
	tagIds,
	q,
	filter: filterEncoded,
	favorite,
	sort,
	page,
}: ListParams): Promise<RecordListVo> => {
	// page 1-based → raw SQL 的 OFFSET 偏移量
	const offset = (page - 1) * PAGE_SIZE;
	const trimmedQuery = q?.trim() ?? "";

	// > 解析搜索字段开关：filter 为 base64 JSON（{title:true,content:true}）；解码失败或无 filter 参数时默认只搜 name
	const filter = decodeFilters(filterEncoded) ?? { title: true };
	const searchTitle = filter.title === true;
	const searchContent = filter.content === true;

	// folderId 为空（空串/undefined）表示"未分类"，统一映射为 null 查询
	const targetFolderId = folderId || null;

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

	// Prisma where 给 count 用，raw SQL where 给列表预览截断用，两者必须同步
	const where: Prisma.PromptRecordWhereInput = {
		ownerId: userId,
		...(isFavoriteMode ? { favoritedBy: { some: { userId } } } : { folderId: targetFolderId }),
		...(tagIds.length > 0 && { tags: { some: { tagId: { in: tagIds } } } }),
		...(searchConditions.length > 0 && { OR: searchConditions }),
	};

	// 构造 SQL WHERE 片段（Prisma 的 select 不支持字符串截断，用原生查询在数据库层完成）
	const whereConditions: Prisma.Sql[] = [Prisma.sql`owner_id = ${userId}`];
	if (isFavoriteMode) {
		// > 收藏筛选：EXISTS 子查询匹配 PromptFavorite，忽略 folder_id
		whereConditions.push(
			Prisma.sql`EXISTS(SELECT 1 FROM prompt."PromptFavorite" pf WHERE pf.record_id = prompt."PromptRecord".id AND pf.user_id = ${userId})`,
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
		prisma.$queryRaw<{ id: string; name: string; preview: string }[]>`
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
					where: { userId, recordId: { in: rowIds } },
					select: { recordId: true },
				})
			: [];
	const favoritedSet = new Set(favoritedRows.map((f) => f.recordId));
	const data = rows.map((r) => ({
		id: r.id,
		name: r.name,
		preview: r.preview,
		favorite: favoritedSet.has(r.id),
	}));

	// 是否还有下一页：本次返回满一页说明数据库可能还有更多
	const hasMore = rows.length === PAGE_SIZE;

	return { data, total, hasMore };
};
