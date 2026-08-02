// # 新建项目内文件夹：校验项目归属、层级深度与同层同名唯一后落表（parentId 自关联，可独立于配置存在）

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { ProjectFolderListItemVo } from "@/shared/lib/zod/schemas/project";

// 文件夹最大深度（根=1）：防脚本化无限嵌套把前端渲染/查询打爆；真实项目通常 3~10 层，40 层留足余量
const MAX_FOLDER_DEPTH = 40;

type CreateParams = {
	userId: string;
	projectId: string;
	parentId?: string;
	name: string;
};

// 沿 parentId 链数某文件夹的深度（根文件夹=1）；沿链循环查询，深度上限内迭代次数有限
const getFolderDepth = async (projectId: string, folderId: string): Promise<number> => {
	let depth = 0;
	let currentId: string | null = folderId;
	while (currentId) {
		depth += 1;
		// 显式标注返回值：绕过 findFirst 在循环体内的类型推断循环
		const folder: { parentId: string | null } | null = await prisma.projectFolder.findFirst({
			where: { id: currentId, projectId },
			select: { parentId: true },
		});
		if (!folder) break;
		currentId = folder.parentId;
	}
	return depth;
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

	// 层级深度上限：新文件夹深度 = 父深度 + 1，超出直接拒绝
	const parentDepth = await getFolderDepth(projectId, resolvedParentId);
	if (parentDepth + 1 > MAX_FOLDER_DEPTH) {
		throw new AiSpecError({
			code: ErrorCode.VALIDATION_ERROR,
			message: `文件夹层级不能超过 ${MAX_FOLDER_DEPTH} 层`,
		});
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
