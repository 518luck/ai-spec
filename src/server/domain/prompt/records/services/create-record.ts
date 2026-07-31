// # 创建收录：写入 PromptRecord 并内联建 v1 快照版本（保证版本历史至少有一条记录）

import { mapTags } from "@/server/utils/map-tags";
import prisma from "@/shared/db";
import type { CreateRecordVo } from "@/shared/lib/zod/schemas/prompt/record";

export const createRecord = async ({
	userId,
	name,
	content,
	images,
	folderId,
	tags,
}: {
	userId: string;
	name: string;
	content: string;
	images: string[];
	folderId: string | null;
	tags?: string[];
}): Promise<CreateRecordVo> => {
	const record = await prisma.promptRecord.create({
		data: {
			name,
			content,
			images,
			ownerId: userId,
			folderId: folderId || null,
			visibility: "private",
			// 标签关联：tags 为 id 数组，直接 create 关联表行；id 不存在时外键约束抛 P2025
			tags: { create: (tags ?? []).map((tagId) => ({ tagId })) },
			// 创建初始版本（v1 快照），保证版本历史至少有一条记录
			versions: {
				create: {
					versionNumber: 1,
					message: "初始版本",
					isSnapshot: true,
					snapshot: content,
					editorId: userId,
				},
			},
		},
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

	// updatedAt 由 Date 转 ISO 字符串；tags 关联记录映射为扁平 {id,name,color,resourceType} 数组
	return {
		...record,
		tags: mapTags(record.tags),
		updatedAt: record.updatedAt.toISOString(),
	};
};
