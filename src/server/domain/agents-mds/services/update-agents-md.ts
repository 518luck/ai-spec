// # 更新项目配置：校验项目归属与挂载文件夹下同名唯一后，更新 name + content（编辑器保存）

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { AgentsMdContentVo } from "@/shared/lib/zod/schemas/project";

type UpdateParams = {
	userId: string;
	projectId: string;
	id: string;
	name: string;
	content: string;
};

export const updateAgentsMd = async ({
	userId,
	projectId,
	id,
	name,
	content,
}: UpdateParams): Promise<AgentsMdContentVo> => {
	// 先校验项目归属，避免在他人项目下修改配置
	const project = await prisma.project.findFirst({
		where: { id: projectId, ownerId: userId, teamId: null },
		select: { id: true },
	});
	if (!project) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "项目不存在" });
	}

	// 取当前配置（含挂载的文件夹，改名时用于查重）
	const doc = await prisma.agentsMd.findFirst({
		where: { id, projectId },
		select: { id: true, name: true, folders: { select: { projectFolderId: true } } },
	});
	if (!doc) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "配置不存在" });
	}

	// 改名时查重：同一挂载文件夹下不允许出现同名配置（多对多场景按挂载关系查重）
	if (doc.name !== name && doc.folders.length > 0) {
		const folderIds = doc.folders.map((f) => f.projectFolderId);
		const dup = await prisma.agentsMd.findFirst({
			where: {
				id: { not: id },
				projectId,
				name,
				folders: { some: { projectFolderId: { in: folderIds } } },
			},
			select: { id: true },
		});
		if (dup) {
			throw new AiSpecError({ code: ErrorCode.CONFLICT, message: `配置「${name}」已存在` });
		}
	}

	const updated = await prisma.agentsMd.update({
		where: { id },
		data: { name, content },
		select: { id: true, name: true, content: true },
	});
	return { id: updated.id, name: updated.name, content: updated.content };
};
