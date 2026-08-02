// # 配置搜索条件构建：按字段开关生成 name/content 的 contains 过滤（忽略大小写），项目内/全项目搜索复用

import type { AgentsMdSearchFieldKey } from "@/shared/lib/zod/schemas/project";

// 字段缺省时默认搜索的字段（名字和内容都搜）
const DEFAULT_SEARCH_FIELDS: AgentsMdSearchFieldKey[] = ["name", "content"];

// 单个字段的 Prisma contains 条件（PostgreSQL 的 insensitive 走 ILIKE）
type FieldMatch = {
	name?: { contains: string; mode: "insensitive" };
	content?: { contains: string; mode: "insensitive" };
};

// > 返回 Prisma where 片段：无关键词返回 undefined（不附加条件，调用方 spread 展开）
export const buildSearchWhere = (
	q: string | undefined,
	fields: AgentsMdSearchFieldKey[] | undefined,
): { OR: FieldMatch[] } | undefined => {
	const keyword = q?.trim();
	if (!keyword) return undefined;
	const activeFields = fields?.length ? fields : DEFAULT_SEARCH_FIELDS;
	return {
		OR: activeFields.map((field) =>
			field === "name"
				? { name: { contains: keyword, mode: "insensitive" as const } }
				: { content: { contains: keyword, mode: "insensitive" as const } },
		),
	};
};
