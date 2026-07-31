// # 查询规约列表：按更新时间倒序，含文件夹/标签/搜索筛选 + 分页

import { mapTags } from "@/server/utils/map-tags";
import { getOrCreatePersonalRuleSpace } from "@/server/utils/rule-space";
import prisma from "@/shared/db";
import type { RuleListVo } from "@/shared/lib/zod/schemas/rule";

// 列表预览的截断长度（字符数）
const PREVIEW_LENGTH = 120;

// 列表查询参数（与 listRulesDtoSchema 对齐，已由 zod 校验保证类型）
type ListParams = {
	userId: string;
	folderId?: string;
	spaceId?: string;
	tagIds: string[];
	q?: string;
	page: number;
	pageSize: number;
};

// > spaceId 缺省走个人默认空间，预览截断 120 字，返回 {data, total, hasMore}
export const listRules = async ({
	userId,
	folderId,
	spaceId,
	tagIds,
	q,
	page,
	pageSize,
}: ListParams): Promise<RuleListVo> => {
	const targetFolderId = folderId || null;
	const trimmedQuery = q?.trim() ?? "";
	// ! 领域空间是顶层隔离：没传 spaceId 时按个人默认空间查，绝不跨空间混列
	const targetSpaceId = spaceId ?? (await getOrCreatePersonalRuleSpace(userId));

	const where = {
		ownerId: userId,
		folderId: targetFolderId,
		spaceId: targetSpaceId,
		// 命中任一选中标签即返回（some 关系）
		...(tagIds.length > 0 && { tags: { some: { tagId: { in: tagIds } } } }),
		...(trimmedQuery && {
			OR: [
				{ name: { contains: trimmedQuery, mode: "insensitive" as const } },
				{ content: { contains: trimmedQuery, mode: "insensitive" as const } },
			],
		}),
	};

	const offset = (page - 1) * pageSize;
	const [rules, total] = await Promise.all([
		prisma.rule.findMany({
			where,
			orderBy: { updatedAt: "desc" },
			select: {
				id: true,
				name: true,
				content: true,
				folderId: true,
				folder: { select: { name: true } },
				tags: { include: { tag: true } },
				createdAt: true,
				updatedAt: true,
			},
			take: pageSize,
			skip: offset,
		}),
		prisma.rule.count({ where }),
	]);

	const data = rules.map((rule) => ({
		id: rule.id,
		name: rule.name,
		preview:
			rule.content.length > PREVIEW_LENGTH
				? `${rule.content.substring(0, PREVIEW_LENGTH)}...`
				: rule.content,
		folderId: rule.folderId,
		folderName: rule.folder?.name ?? null,
		tags: mapTags(rule.tags),
		createdAt: rule.createdAt.toISOString(),
		updatedAt: rule.updatedAt.toISOString(),
	}));

	return { data, total, hasMore: rules.length === pageSize };
};
