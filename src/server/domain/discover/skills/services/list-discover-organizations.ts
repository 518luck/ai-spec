// # 广场 skill 组织聚合：按 GitHub 组织分组统计 skill 数量（raw SQL GROUP BY），供前端侧边栏筛选
// > 仅聚合 DiscoverSkill；其他资源类型若有组织筛选应各自挂在对应资源路径下。
// > 物理表名是 DiscoverSkill（无 @@map），raw SQL 必须写 discover."DiscoverSkill"

import { DISCOVER_FRONTEND_LICENSE_ALLOWLIST } from "@/server/domain/discover/skills";
import prisma from "@/shared/db";
import { Prisma } from "@/shared/db/generator/client";
import type { OrganizationListVo } from "@/shared/lib/zod/schemas/discover-skill";

// > 计数口径与列表一致：白名单协议或无协议
export const listDiscoverOrganizations = async (): Promise<OrganizationListVo> => {
	const licenseList = Prisma.join([...DISCOVER_FRONTEND_LICENSE_ALLOWLIST]);
	const rows = await prisma.$queryRaw<
		{
			authorName: string;
			authorType: string | null;
			authorAvatarUrl: string | null;
			authorHtmlUrl: string | null;
			skillCount: number;
		}[]
	>`
		SELECT
			author_name AS "authorName",
			author_type AS "authorType",
			author_avatar_url AS "authorAvatarUrl",
			author_html_url AS "authorHtmlUrl",
			COUNT(*)::int AS "skillCount"
		FROM discover."DiscoverSkill"
		WHERE delisted_at IS NULL
			AND author_name IS NOT NULL
			AND author_type = 'Organization'
			AND (license IN (${licenseList}) OR license IS NULL)
		GROUP BY
			author_name,
			author_type,
			author_avatar_url,
			author_html_url
		ORDER BY "skillCount" DESC, author_name ASC
	`;

	return { data: rows, total: rows.length };
};
