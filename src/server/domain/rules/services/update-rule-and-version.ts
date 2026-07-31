// # 更新规约并按需创建版本：name/content 变更才建版本，folder/tags/space 变更不建（事务保证原子性）

import { AiSpecError } from "@/server/errors/http-error";
import { calculateDiff, serializeDiff } from "@/server/utils/diff";
import { mapTags } from "@/server/utils/map-tags";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { RuleVo } from "@/shared/lib/zod/schemas/rule";

// 规约部分更新补丁（update-rule 和本文件共用）
export type RuleUpdatePatch = {
	name?: string;
	content?: string;
	folderId?: string | null;
	tags?: string[];
};

// 版本快照策略：v1 强制快照 + 每 10 版一次快照锚点
const isSnapshotVersion = (versionNumber: number): boolean =>
	versionNumber === 1 || versionNumber % 10 === 0;

// > 规约更新 + 版本记录（事务）：标签 deleteMany+create、移空间连带、内容变更建版本
export const updateRuleAndVersion = async ({
	userId,
	id,
	patch,
}: {
	userId: string;
	id: string;
	patch: RuleUpdatePatch;
}): Promise<RuleVo> => {
	const { name, content, folderId, tags } = patch;

	// 验证规约存在且属于当前用户；取 content 用于计算版本 diff
	const existingRule = await prisma.rule.findFirst({
		where: { id, ownerId: userId },
		select: { content: true },
	});
	if (!existingRule) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "规约不存在" });
	}

	// 目标文件夹：换文件夹时用它的领域空间校正规约归属
	const targetFolder = folderId
		? await prisma.folder.findFirst({
				where: { id: folderId, ownerId: userId },
				select: { ruleSpaceId: true },
			})
		: null;
	if (folderId && !targetFolder) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "文件夹不存在" });
	}

	// 构建部分更新数据：只更新传入的字段
	const data: {
		name?: string;
		content?: string;
		folderId?: string | null;
		spaceId?: string;
		tags?: { create: { tagId: string }[] };
	} = {};
	if (name !== undefined) data.name = name;
	if (content !== undefined) data.content = content;
	// folderId 收到 null/"" 表示清空为未分类（落到 DB 的 NULL），收到有效字符串表示归属该文件夹
	if (folderId !== undefined) data.folderId = folderId || null;
	// ! 移入其他空间的文件夹时 spaceId 必须跟着走，否则规约会滞留在原空间
	if (targetFolder?.ruleSpaceId) data.spaceId = targetFolder.ruleSpaceId;
	// 标签关联全量替换：tags === undefined 时不动
	// ! 不能用 set：RuleTag 是复合主键 (ruleId,tagId)，set 要求 unique 定位，会报 P2009
	// ! deleteMany + create 必须放进事务：否则中途失败会丢标签
	if (tags !== undefined) {
		data.tags = { create: tags.map((tagId) => ({ tagId })) };
	}

	// 版本记录：name 或 content 变更时建版本
	const newContent = content ?? existingRule.content;
	const hasContentChange = name !== undefined || content !== undefined;

	// > 事务保证原子性：deleteMany + update（含 tags.create）+ 版本记录创建要么全成要么全败
	const rule = await prisma.$transaction(async (tx) => {
		if (tags !== undefined) {
			await tx.ruleTag.deleteMany({ where: { ruleId: id } });
		}

		// 如果有内容变更，创建版本记录（混合 diff：每 10 版存一次全量快照，其余存增量 diff）
		if (hasContentChange) {
			const latestVersion = await tx.ruleVersion.findFirst({
				where: { ruleId: id },
				orderBy: { versionNumber: "desc" },
				select: { versionNumber: true },
			});
			const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
			const isSnapshot = isSnapshotVersion(nextVersionNumber);
			const diff = calculateDiff({ oldText: existingRule.content, newText: newContent });

			await tx.ruleVersion.create({
				data: {
					ruleId: id,
					editorId: userId,
					versionNumber: nextVersionNumber,
					isSnapshot,
					snapshot: isSnapshot ? newContent : null,
					diff: isSnapshot ? null : serializeDiff(diff),
				},
			});
		}

		return tx.rule.update({
			where: { id, ownerId: userId },
			data,
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
	});

	// 转换时间格式 + 扁平化标签关联
	return {
		...rule,
		tags: mapTags(rule.tags),
		createdAt: rule.createdAt.toISOString(),
		updatedAt: rule.updatedAt.toISOString(),
	};
};
