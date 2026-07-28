import type { Prisma } from "@/shared/db/generator/client";
import type { DiscoverSkillListItemVo } from "@/shared/lib/zod/schemas/discover-skill";

import { DISCOVER_FRONTEND_LICENSE_ALLOWLIST } from "../constants";

// # DiscoverSkill 行 → 列表项 Vo 的公共映射（广场列表接口与导入接口复用）

// > 前端读接口共用：白名单协议，或无协议（null）；均可展示 name/description + license 标记 + 回链
export const discoverSkillFrontendLicenseWhere = {
	OR: [{ license: { in: [...DISCOVER_FRONTEND_LICENSE_ALLOWLIST] } }, { license: null }],
} satisfies Prisma.DiscoverSkillWhereInput;

// 列表项所需字段的统一 select（广场只索引元数据）
export const discoverSkillListItemSelect = {
	id: true,
	name: true,
	description: true,
	descriptionZh: true,
	license: true,
	sourceRepo: true,
	sourceUrl: true,
	authorName: true,
	authorType: true,
	authorAvatarUrl: true,
	authorHtmlUrl: true,
	stars: true,
	updatedAt: true,
} satisfies Prisma.DiscoverSkillSelect;

type DiscoverSkillListItemRow = Prisma.DiscoverSkillGetPayload<{
	select: typeof discoverSkillListItemSelect;
}>;

// 行 → Vo：时间转 ISO 字符串；中英文描述都下发，展示语言由前端切换
export const toDiscoverSkillListItem = (
	row: DiscoverSkillListItemRow,
): DiscoverSkillListItemVo => ({
	id: row.id,
	name: row.name,
	description: row.description,
	descriptionZh: row.descriptionZh,
	license: row.license,
	sourceRepo: row.sourceRepo,
	sourceUrl: row.sourceUrl,
	authorName: row.authorName,
	authorType: row.authorType,
	authorAvatarUrl: row.authorAvatarUrl,
	authorHtmlUrl: row.authorHtmlUrl,
	stars: row.stars,
	updatedAt: row.updatedAt.toISOString(),
});
