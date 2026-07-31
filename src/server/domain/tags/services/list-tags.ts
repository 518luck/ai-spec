// # 查询个人空间标签列表：按资源类型过滤
// > 按"用户 × 资源类型"隔离，teamId 始终为 null（个人空间），与 folder-service 对称

import type { TAGGABLE_RESOURCE_KEYS } from "@/server/rbac/resource-ui";
import prisma from "@/shared/db";
import type { TagListVo } from "@/shared/lib/zod/schemas/tag";

// 标签资源类型联合（与 tagResourceTypeSchema 的 z.enum 对齐）
type TagResourceType = (typeof TAGGABLE_RESOURCE_KEYS)[number];

// 列表查询入参（type 由 procedure 层 zod 校验后注入）
type ListParams = {
	userId: string;
	type?: string;
};

// > 查询当前用户的标签列表，按资源类型过滤；按 name 字母序返回
export const listTags = async ({ userId, type }: ListParams): Promise<TagListVo> => {
	// 个人空间：ownerId 隔离 + teamId 始终 null；type 可选，传了按资源类型过滤
	const tags = await prisma.tag.findMany({
		where: { ownerId: userId, teamId: null, ...(type && { resourceType: type }) },
		orderBy: [{ name: "asc" }],
		select: { id: true, name: true, color: true, resourceType: true },
	});
	// DB 列是 string，业务侧收敛为资源 key 联合（值由受控写入保证，.output 会再次校验）
	return tags.map((t) => ({ ...t, resourceType: t.resourceType as TagResourceType }));
};
