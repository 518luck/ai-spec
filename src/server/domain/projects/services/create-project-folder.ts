// # 新建项目内文件夹：校验项目归属与同层同名唯一后落表（parentId 自关联，可独立于配置存在）

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { ProjectFolderListItemVo } from "@/shared/lib/zod/schemas/project";

type CreateParams = {
	userId: string;
	projectId: string;
	parentId?: string;
	name: string;
};

export const createProjectFolder = async ({
	userId,
	projectId,
	parentId,
	name,
}: CreateParams): Promise<ProjectFolderListItemVo> => {
	// 先校验项目归属，避免在他人项目下建文件夹
	const project = await prisma.project.findFirst({
		where: { id: projectId, ownerId: userId, teamId: null },
		select: { id: true },
	});
	if (!project) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "项目不存在" });
	}

	// 父文件夹缺省 = 项目根文件夹（parentId 为 null 的记录）；指定时校验归属项目
	let resolvedParentId: string;
	if (parentId) {
		const parent = await prisma.projectFolder.findFirst({
			where: { id: parentId, projectId },
			select: { id: true },
		});
		if (!parent) {
			throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "父文件夹不存在" });
		}
		resolvedParentId = parentId;
	} else {
		const root = await prisma.projectFolder.findFirst({
			where: { projectId, parentId: null },
			select: { id: true },
		});
		if (!root) {
			throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "项目根文件夹不存在" });
		}
		resolvedParentId = root.id;
	}

	// 同层同名唯一（parentId 固定为非空，唯一约束正常生效）
	const existing = await prisma.projectFolder.findFirst({
		where: { projectId, parentId: resolvedParentId, name },
		select: { id: true },
	});
	if (existing) {
		throw new AiSpecError({ code: ErrorCode.CONFLICT, message: `文件夹「${name}」已存在` });
	}

	const folder = await prisma.projectFolder.create({
		data: { name, parentId: resolvedParentId, projectId },
		select: { id: true, parentId: true, name: true },
	});
	return folder;
};
