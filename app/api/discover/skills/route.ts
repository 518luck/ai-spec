import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import { discoverSkillListItemSelect, toDiscoverSkillListItem } from "@/server/utils/discover-vo";
import prisma from "@/shared/db";
import {
	discoverSkillListVoSchema,
	listDiscoverSkillsDtoSchema,
} from "@/shared/lib/zod/schemas/discover-skill";

// # 发现广场：skill 列表查询（搜索 + 分页，按 star 倒序）

// 分页大小
const PAGE_SIZE = 30;

// > 本表即广场索引（GitHub 缓存）；用户自建 skill 将来在个人空间域独立建表
export const GET = withPersonal(
	async ({ searchParams }) => {
		const parsed = listDiscoverSkillsDtoSchema.safeParse(searchParams);
		if (!parsed.success) {
			throw parsed.error;
		}
		const { q, orgs, offset = 0 } = parsed.data;
		const trimmedQuery = q?.trim() ?? "";
		// 解析组织筛选：逗号分隔的 authorName 列表
		const orgNames = (orgs ?? "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);

		// 构建查询条件：过滤已下架条目，可选组织筛选，搜索命中名称或描述
		const where = {
			delistedAt: null,
			...(orgNames.length > 0 && {
				authorType: "Organization" as const,
				authorName: { in: orgNames },
			}),
			...(trimmedQuery && {
				OR: [
					{ name: { contains: trimmedQuery, mode: "insensitive" as const } },
					{ description: { contains: trimmedQuery, mode: "insensitive" as const } },
				],
			}),
		};

		// 查询列表和总数
		const [rows, total] = await Promise.all([
			prisma.discoverSkill.findMany({
				where,
				// ! id 兜底排序：stars/updatedAt 大量并列时保证顺序确定，杜绝分页 key 重复
				orderBy: [{ stars: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
				select: discoverSkillListItemSelect,
				take: PAGE_SIZE,
				skip: offset,
			}),
			prisma.discoverSkill.count({ where }),
		]);

		const data = rows.map(toDiscoverSkillListItem);

		// 是否还有下一页
		const hasMore = rows.length === PAGE_SIZE;
		const nextOffset = hasMore ? offset + rows.length : undefined;

		// 经 Vo schema 校验
		const voResult = discoverSkillListVoSchema.safeParse({
			data,
			total,
			hasMore,
			nextOffset,
		});
		if (!voResult.success) {
			throw voResult.error;
		}

		return NextResponse.json(voResult.data);
	},
	{ permissions: ["discover.read"] },
);
