// # 项目单条详情：返回名称/简介/文件夹归属 + 文档计数（抽屉取数用）

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { ProjectVo } from "@/shared/lib/zod/schemas/project";

export const getProjectById = async ({
	userId,
	id,
}: {
	userId: string;
	id: string;
}): Promise<ProjectVo> => {
	const project = await prisma.project.findFirst({
		where: { id, ownerId: userId, teamId: null },
		select: {
			id: true,
			name: true,
			description: true,
			folderId: true,
			folder: { select: { name: true, color: true } },
			_count: { select: { docs: true } },
			createdAt: true,
			updatedAt: true,
		},
	});
	if (!project) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "项目不存在" });
	}
	return {
		id: project.id,
		name: project.name,
		description: project.description ?? "",
		folderId: project.folderId,
		folderName: project.folder?.name ?? null,
		folderColor: project.folder?.color ?? null,
		docCount: project._count.docs,
		createdAt: project.createdAt.toISOString(),
		updatedAt: project.updatedAt.toISOString(),
	};
};
