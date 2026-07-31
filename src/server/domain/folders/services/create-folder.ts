// # 新建文件夹：规约文件夹的领域空间归属跟随 spaceId，未传时回落个人默认空间

import type { FOLDERABLE_RESOURCE_KEYS } from "@/server/rbac/resource-ui";
import { resolveRuleSpaceId } from "@/server/utils/rule-space";
import prisma from "@/shared/db";
import type { FolderOptionVo } from "@/shared/lib/zod/schemas/folder";

const RULE_RESOURCE_TYPE = "rules";

type FolderResourceType = (typeof FOLDERABLE_RESOURCE_KEYS)[number];

export const createFolder = async ({
	userId,
	name,
	description,
	color,
	resourceType,
	spaceId,
}: {
	userId: string;
	name: string;
	description?: string | null;
	color: string;
	resourceType: FolderResourceType;
	spaceId?: string;
}): Promise<FolderOptionVo> => {
	const ruleSpaceId =
		resourceType === RULE_RESOURCE_TYPE ? await resolveRuleSpaceId({ userId, spaceId }) : null;

	const folder = await prisma.folder.create({
		data: {
			name,
			description: description || null,
			color,
			resourceType,
			ownerId: userId,
			teamId: null,
			ruleSpaceId,
		},
		select: { id: true, name: true, color: true, resourceType: true },
	});

	return {
		id: folder.id,
		name: folder.name,
		color: folder.color,
		resourceType: folder.resourceType as FolderResourceType,
	};
};
