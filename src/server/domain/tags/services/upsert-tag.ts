// # 标签 upsert：同用户同资源同名标签存在则复用 id 并更新 color，不存在则新建
// > 按"用户 × 资源类型"隔离，teamId 始终为 null（个人空间）
// ! teamId 当前写死 null（个人空间），与 folder-service 一致
// ! 团队功能上线时不要从 session 自动推断 teamId——会让加入团队的用户无法再用个人空间

import type { TAGGABLE_RESOURCE_KEYS } from "@/server/rbac/resource-ui";
import prisma from "@/shared/db";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";

// 标签资源类型联合（与 tagResourceTypeSchema 的 z.enum 对齐）
type TagResourceType = (typeof TAGGABLE_RESOURCE_KEYS)[number];

// > upsert 语义：同用户同资源同名标签存在则复用 id 并更新 color，不存在则新建
export const upsertTag = async ({
	userId,
	name,
	color,
	resourceType,
}: {
	userId: string;
	name: string;
	color: string;
	resourceType: TagResourceType;
}): Promise<TagOptionVo> => {
	// 先查同用户同资源同名的标签是否存在（teamId=null = 个人空间）
	const existing = await prisma.tag.findFirst({
		where: { ownerId: userId, teamId: null, resourceType, name },
		select: { id: true },
	});

	if (existing) {
		// 存在：复用 id，更新 color（同名标签的颜色以最新提交为准）
		const tag = await prisma.tag.update({
			where: { id: existing.id },
			data: { color },
			select: { id: true, name: true, color: true, resourceType: true },
		});
		return { ...tag, resourceType: tag.resourceType as TagResourceType };
	}

	// 不存在：新建（color 由 schema 保证必填，DB @default 作防御兜底）
	const tag = await prisma.tag.create({
		data: {
			name,
			color,
			resourceType,
			ownerId: userId,
			teamId: null,
		},
		select: { id: true, name: true, color: true, resourceType: true },
	});
	return { ...tag, resourceType: tag.resourceType as TagResourceType };
};
