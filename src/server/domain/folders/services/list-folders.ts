// # 查询个人空间文件夹列表：按资源类型 + 领域空间过滤

import type { FOLDERABLE_RESOURCE_KEYS } from "@/server/rbac/resource-ui";
import { getOrCreatePersonalRuleSpace } from "@/server/utils/rule-space";
import prisma from "@/shared/db";
import type { FolderListVo } from "@/shared/lib/zod/schemas/folder";

// 规约文件夹的资源类型：这类文件夹必须挂在规约领域空间下，其余资源类型的文件夹与空间无关
const RULE_RESOURCE_TYPE = "rules";

// 文件夹资源类型联合（与 folderResourceTypeSchema 的 z.enum 对齐）
type FolderResourceType = (typeof FOLDERABLE_RESOURCE_KEYS)[number];

// ! 规约文件夹按领域空间隔离：type=rules 且没传 spaceId 时收敛到个人默认空间，绝不跨空间混列
export const listFolders = async ({
	userId,
	type,
	spaceId,
}: {
	userId: string;
	type?: FolderResourceType;
	spaceId?: string;
}): Promise<FolderListVo> => {
	const ruleSpaceId =
		type === RULE_RESOURCE_TYPE ? (spaceId ?? (await getOrCreatePersonalRuleSpace(userId))) : null;

	const folders = await prisma.folder.findMany({
		where: {
			ownerId: userId,
			teamId: null,
			...(type && { resourceType: type }),
			...(ruleSpaceId && { ruleSpaceId }),
		},
		orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
		select: { id: true, name: true, color: true, resourceType: true },
	});

	return folders.map((f) => ({
		id: f.id,
		name: f.name,
		color: f.color,
		resourceType: f.resourceType as FolderResourceType,
	}));
};
