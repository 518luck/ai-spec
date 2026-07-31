// # 广场 skill 列表查询：搜索 + 组织筛选 + 热度门槛 + 分页，按 star 倒序 + id 兜底排序
// > 本表即广场索引（GitHub 缓存）；用户自建 skill 将来在个人空间域独立建表。
// > 列表无 ownerId 隔离：公共索引，所有登录用户看到同一份。

import {
	discoverSkillFrontendLicenseWhere,
	discoverSkillListItemSelect,
	toDiscoverSkillListItem,
} from "@/server/domain/discover/skills";
import prisma from "@/shared/db";
import type { Prisma } from "@/shared/db/generator/client";
import { decodeFilters } from "@/shared/lib/search-filter-codec";
import type { DiscoverSkillListVo } from "@/shared/lib/zod/schemas/discover-skill";

// 列表分页大小（与原 route.ts 一致）
const PAGE_SIZE = 30;

// 列表查询参数（与 listDiscoverSkillsDtoSchema 对齐，已由 zod 校验保证类型）
type ListParams = {
	q?: string;
	filter?: string;
	orgs?: string;
	minStars?: number;
	page?: number;
};

// > 广场列表：已下架排除 + license 白名单 + 可选组织/热度/搜索；AND 包裹避免 OR 互覆盖
export const listDiscoverSkills = async ({
	q,
	filter: filterEncoded,
	orgs,
	minStars,
	page = 1,
}: ListParams): Promise<DiscoverSkillListVo> => {
	const trimmedQuery = q?.trim() ?? "";
	// page 1-based → Prisma 的 skip 偏移量
	const offset = (page - 1) * PAGE_SIZE;
	// > 解析字段开关：filter 为 base64 JSON（{title:true,description:true}）；解码失败或无 filter 参数时默认只搜 name
	const filter = decodeFilters(filterEncoded) ?? { title: true };
	// title=true 搜 name，description=true 搜 description / descriptionZh；旧 content 开关兼容一段时间
	const searchTitle = filter.title === true;
	const searchDescription = filter.description === true || filter.content === true;
	// 解析组织筛选：逗号分隔的 authorName 列表
	const orgNames = (orgs ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);

	// 按开关动态拼搜索条件（title→name，description→中英文描述）
	const searchConditions: Prisma.DiscoverSkillWhereInput[] = [];
	if (trimmedQuery && searchTitle) {
		searchConditions.push({ name: { contains: trimmedQuery, mode: "insensitive" } });
	}
	if (trimmedQuery && searchDescription) {
		searchConditions.push({ description: { contains: trimmedQuery, mode: "insensitive" } });
		// 已译中文也可被搜到（用户用中文关键词检索）
		searchConditions.push({ descriptionZh: { contains: trimmedQuery, mode: "insensitive" } });
	}

	// 构建查询条件：已下架排除 + 目录可见 license（白名单或无协议）；可选组织 / 热度 / 搜索
	// ! license 条件本身含 OR，搜索也是 OR，必须放进 AND，避免顶层 OR 被后写覆盖
	const where: Prisma.DiscoverSkillWhereInput = {
		AND: [
			{ delistedAt: null },
			discoverSkillFrontendLicenseWhere,
			...(orgNames.length > 0
				? [{ authorType: "Organization" as const, authorName: { in: orgNames } }]
				: []),
			...(minStars !== undefined && minStars > 0 ? [{ stars: { gte: minStars } }] : []),
			...(searchConditions.length > 0 ? [{ OR: searchConditions }] : []),
		],
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
	// 是否还有下一页：本次返回满一页说明可能还有更多
	const hasMore = rows.length === PAGE_SIZE;

	return { data, total, hasMore };
};
