import type { Prisma } from "@/shared/db/generator/client";
import type { DiscoverSkillListItemVo } from "@/shared/lib/zod/schemas/discover-skill";

// # DiscoverSkill 行 → 列表项 Vo 的公共映射（广场列表接口与导入接口复用）

// 列表项所需字段的统一 select（content 仅用于折算 hasContent，不外传全文）
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
	content: true,
	updatedAt: true,
} satisfies Prisma.DiscoverSkillSelect;

type DiscoverSkillListItemRow = Prisma.DiscoverSkillGetPayload<{
	select: typeof discoverSkillListItemSelect;
}>;

// 行 → Vo：时间转 ISO 字符串，content 折算成 hasContent；description 优先中文
export const toDiscoverSkillListItem = (
	row: DiscoverSkillListItemRow,
): DiscoverSkillListItemVo => ({
	id: row.id,
	name: row.name,
	// 有中文描述则给前端中文，否则回落原文（待译/失败时仍可展示英文）
	description: row.descriptionZh ?? row.description,
	license: row.license,
	sourceRepo: row.sourceRepo,
	sourceUrl: row.sourceUrl,
	authorName: row.authorName,
	authorType: row.authorType,
	authorAvatarUrl: row.authorAvatarUrl,
	authorHtmlUrl: row.authorHtmlUrl,
	stars: row.stars,
	hasContent: row.content !== null,
	updatedAt: row.updatedAt.toISOString(),
});
