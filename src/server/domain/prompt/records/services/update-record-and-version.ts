// # 收录更新并按需创建版本：name/content 变更才建版本，folder/tags/images/message 变更不建
// > 与 rules 领域的 version-service 同构，区别仅在 prisma 模型（promptRecordVersion）与外键名（recordId）
// > 收录更新 + 版本记录（事务）：标签 deleteMany+create、内容变更建版本

import { AiSpecError } from "@/server/errors/http-error";
import { calculateDiff, serializeDiff } from "@/server/utils/diff";
import { mapTags } from "@/server/utils/map-tags";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { CreateRecordVo } from "@/shared/lib/zod/schemas/prompt/record";

// 版本快照策略：v1 强制快照 + 每 10 版一次快照锚点
const isSnapshotVersion = (versionNumber: number): boolean =>
	versionNumber === 1 || versionNumber % 10 === 0;

// 收录更新补丁：与 updateRecordDtoSchema 对齐（可选字段）
export type RecordUpdatePatch = {
	name?: string;
	content?: string;
	images?: string[];
	folderId?: string | null;
	tags?: string[];
	message?: string;
};

export const updateRecordAndVersion = async ({
	userId,
	id,
	patch,
}: {
	userId: string;
	id: string;
	patch: RecordUpdatePatch;
}): Promise<CreateRecordVo> => {
	const { name, content, images, folderId, tags, message } = patch;

	// 验证收录存在且属于当前用户；取 content 用于计算版本 diff
	const currentRecord = await prisma.promptRecord.findFirst({
		where: { id, ownerId: userId },
		select: { content: true },
	});
	if (!currentRecord) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "收录不存在" });
	}

	// 构建部分更新数据：只更新传入的字段
	const data: {
		name?: string;
		content?: string;
		images?: string[];
		folderId?: string | null;
		tags?: { create: { tagId: string }[] };
	} = {};
	if (name !== undefined) data.name = name;
	if (content !== undefined) data.content = content;
	if (images !== undefined) data.images = images;
	// folderId 收到 null/"" 表示清空为未分类（落到 DB 的 NULL），收到有效字符串表示归属该文件夹
	if (folderId !== undefined) data.folderId = folderId || null;
	// 标签关联全量替换：tags === undefined 时不动
	// ! 不能用 set：PromptRecordTag 是复合主键 (recordId,tagId)，set 要求 unique 定位，会报 P2009
	// ! deleteMany + create 必须放进事务：否则中途失败会丢标签
	if (tags !== undefined) {
		data.tags = { create: tags.map((tagId) => ({ tagId })) };
	}

	// 版本记录：name 或 content 变更时建版本
	const newContent = content ?? currentRecord.content;
	const hasContentChange = name !== undefined || content !== undefined;

	// > 事务保证原子性：deleteMany + update（含 tags.create）+ 版本记录创建要么全成要么全败
	const updated = await prisma.$transaction(async (tx) => {
		if (tags !== undefined) {
			await tx.promptRecordTag.deleteMany({ where: { recordId: id } });
		}

		// 如果有内容变更，创建版本记录（混合 diff：每 10 版存一次全量快照，其余存增量 diff）
		if (hasContentChange) {
			const latestVersion = await tx.promptRecordVersion.findFirst({
				where: { recordId: id },
				orderBy: { versionNumber: "desc" },
				select: { versionNumber: true },
			});
			const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
			const isSnapshot = isSnapshotVersion(nextVersionNumber);
			const diff = calculateDiff({
				oldText: currentRecord.content,
				newText: newContent,
			});

			await tx.promptRecordVersion.create({
				data: {
					recordId: id,
					editorId: userId,
					versionNumber: nextVersionNumber,
					message: message ?? null,
					isSnapshot,
					snapshot: isSnapshot ? newContent : null,
					diff: isSnapshot ? null : serializeDiff(diff),
				},
			});
		}

		return tx.promptRecord.update({
			where: { id, ownerId: userId },
			data,
			select: {
				id: true,
				name: true,
				content: true,
				visibility: true,
				folderId: true,
				tags: { include: { tag: true } },
				updatedAt: true,
			},
		});
	});

	// 转换时间格式 + 扁平化标签关联
	return {
		...updated,
		tags: mapTags(updated.tags),
		updatedAt: updated.updatedAt.toISOString(),
	};
};
