// # 新建项目配置（AGENTS.md）：校验项目归属与文件夹下同名唯一后，事务创建配置并挂载到文件夹

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { makeAgentsMdListItem } from "../lib/agents-md-item";

// 新配置默认正文模板：摘要取首个非标题正文行
const makeDefaultContent = (name: string): string => `# ${name}

（在此编写 AI 配置说明）
`;

type CreateParams = {
	userId: string;
	projectId: string;
	folderId: string;
	name: string;
};

export const createAgentsMd = async ({
	userId,
	projectId,
	folderId,
	name,
}: CreateParams): Promise<AgentsMdListItemVo> => {
	// 先校验项目归属，避免在他人项目下创建配置
	const project = await prisma.project.findFirst({
		where: { id: projectId, ownerId: userId, teamId: null },
		select: { id: true },
	});
	if (!project) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "项目不存在" });
	}

	// 文件夹必须属于同一项目
	const folder = await prisma.projectFolder.findFirst({
		where: { id: folderId, projectId },
		select: { id: true },
	});
	if (!folder) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "文件夹不存在" });
	}

	// 同一文件夹下同名配置唯一（多对多场景按挂载关系查重）
	const existing = await prisma.agentsMd.findFirst({
		where: { projectId, name, folders: { some: { projectFolderId: folderId } } },
		select: { id: true },
	});
	if (existing) {
		throw new AiSpecError({ code: ErrorCode.CONFLICT, message: `配置「${name}」已存在` });
	}

	// 事务：配置落库 + 挂载关系落库，保证两者同生共死
	const doc = await prisma.$transaction(async (tx) => {
		const created = await tx.agentsMd.create({
			data: { name, content: makeDefaultContent(name), projectId, ownerId: userId },
			select: { id: true, name: true, content: true },
		});
		await tx.agentsMdFolder.create({
			data: { agentsMdId: created.id, projectFolderId: folderId },
		});
		return created;
	});
	return makeAgentsMdListItem(doc.id, doc.name, doc.content, [folderId]);
};
