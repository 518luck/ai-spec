// # 查询项目内文件夹列表：校验项目归属后返回全部文件夹（树形结构，parentId 自关联）

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { ProjectFolderListVo } from "@/shared/lib/zod/schemas/project";

type ListParams = {
	userId: string;
	projectId: string;
};

export const listProjectFolders = async ({
	userId,
	projectId,
}: ListParams): Promise<ProjectFolderListVo> => {
	// 先校验项目归属，避免泄漏他人项目下的文件夹清单
	const project = await prisma.project.findFirst({
		where: { id: projectId, ownerId: userId, teamId: null },
		select: { id: true },
	});
	if (!project) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "项目不存在" });
	}

	return prisma.projectFolder.findMany({
		where: { projectId },
		orderBy: { name: "asc" },
		select: { id: true, parentId: true, name: true },
	});
};
