import { NextResponse } from "next/server";

import { withPersonal } from "@/server/middleware/with-personal";
import { discoverSkillListItemSelect, toDiscoverSkillListItem } from "@/server/utils/discover-vo";
import prisma from "@/shared/db";
import type { Prisma } from "@/shared/db/generator/client";
import { decodeFilters } from "@/shared/lib/search-filter";
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
		const { q, filter: filterEncoded, orgs, minStars, offset = 0 } = parsed.data;
		const trimmedQuery = q?.trim() ?? "";
		// > 解析字段开关：filter 为 base64 JSON（{title:true,content:true}）；解码失败或无 filter 参数时默认只搜 name
		const filter = decodeFilters(filterEncoded) ?? { title: true };
		// title=true 搜 name，content=true 搜 description / descriptionZh；两开关都关时不加搜索条件（兜底）
		const searchTitle = filter.title === true;
		const searchContent = filter.content === true;
		// 解析组织筛选：逗号分隔的 authorName 列表
		const orgNames = (orgs ?? "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);

		// 按开关动态拼搜索条件（title→name，content→中英文描述）
		const searchConditions: Prisma.DiscoverSkillWhereInput[] = [];
		if (trimmedQuery && searchTitle) {
			searchConditions.push({ name: { contains: trimmedQuery, mode: "insensitive" } });
		}
		if (trimmedQuery && searchContent) {
			searchConditions.push({ description: { contains: trimmedQuery, mode: "insensitive" } });
			// 已译中文也可被搜到（用户用中文关键词检索）
			searchConditions.push({ descriptionZh: { contains: trimmedQuery, mode: "insensitive" } });
		}

		// 构建查询条件：过滤已下架条目，可选组织 / 热度门槛 / 搜索；列表始终按 star 递减
		const where: Prisma.DiscoverSkillWhereInput = {
			delistedAt: null,
			...(orgNames.length > 0 && {
				authorType: "Organization" as const,
				authorName: { in: orgNames },
			}),
			...(minStars !== undefined &&
				minStars > 0 && {
					stars: { gte: minStars },
				}),
			...(searchConditions.length > 0 && { OR: searchConditions }),
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
