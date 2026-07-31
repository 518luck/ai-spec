// # 新建规约：空间归属跟随所选文件夹，未选文件夹时落到个人默认空间

import { AiSpecError } from "@/server/errors/http-error";
import { mapTags } from "@/server/utils/map-tags";
import { resolveRuleSpaceId } from "@/server/utils/rule-space";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { RuleVo } from "@/shared/lib/zod/schemas/rule";

export const createRule = async ({
	userId,
	name,
	content,
	folderId,
	spaceId,
	tags,
}: {
	userId: string;
	name: string;
	content: string;
	folderId: string | null;
	spaceId?: string;
	tags?: string[];
}): Promise<RuleVo> => {
	const targetFolderId = folderId || null;

	// ! 规则的 spaceId 必须与所在文件夹的空间一致，否则规则会出现在文件夹之外的空间里
	const folder = targetFolderId
		? await prisma.folder.findFirst({
				where: { id: targetFolderId, ownerId: userId },
				select: { ruleSpaceId: true },
			})
		: null;
	if (targetFolderId && !folder) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "文件夹不存在" });
	}

	const targetSpaceId = folder?.ruleSpaceId ?? (await resolveRuleSpaceId({ userId, spaceId }));

	const rule = await prisma.rule.create({
		data: {
			name,
			content,
			ownerId: userId,
			spaceId: targetSpaceId,
			folderId: targetFolderId,
			// 标签关联：tags 为 id 数组，直接 create 关联表行；id 不存在时外键约束抛 P2025
			tags: { create: (tags ?? []).map((tagId) => ({ tagId })) },
		},
		select: {
			id: true,
			name: true,
			content: true,
			folderId: true,
			tags: { include: { tag: true } },
			createdAt: true,
			updatedAt: true,
		},
	});

	return {
		...rule,
		tags: mapTags(rule.tags),
		createdAt: rule.createdAt.toISOString(),
		updatedAt: rule.updatedAt.toISOString(),
	};
};
