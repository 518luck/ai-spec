// # 删除项目内文件夹：校验归属后删除（数据库级联删子树文件夹与挂载关系，配置本身保留）

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

type DeleteParams = {
	userId: string;
	projectId: string;
	id: string;
};

export const deleteProjectFolder = async ({
	userId,
	projectId,
	id,
}: DeleteParams): Promise<{ id: string }> => {
	// 先校验项目归属，避免删除他人项目下的文件夹
	const project = await prisma.project.findFirst({
		where: { id: projectId, ownerId: userId, teamId: null },
		select: { id: true },
	});
	if (!project) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "项目不存在" });
	}

	const folder = await prisma.projectFolder.findFirst({
		where: { id, projectId },
		select: { id: true, parentId: true },
	});
	if (!folder) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "文件夹不存在" });
	}
	// 根文件夹是顶层挂载点，删除会破坏整个树，禁止
	if (folder.parentId === null) {
		throw new AiSpecError({ code: ErrorCode.FORBIDDEN, message: "项目根文件夹不能删除" });
	}

	// 子树文件夹与挂载关系由数据库级联删除（parentId / projectFolderId 均 onDelete: Cascade）
	await prisma.projectFolder.delete({ where: { id } });
	return { id };
};
