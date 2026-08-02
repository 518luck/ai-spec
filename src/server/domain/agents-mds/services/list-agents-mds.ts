// # 查询项目配置列表：按 name 升序，支持按文件夹筛选（中间表直接挂载）；摘要从 content 提取

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { AgentsMdListItemVo, AgentsMdListVo } from "@/shared/lib/zod/schemas/project";

// 摘要截断长度（字符数）
const EXCERPT_LENGTH = 120;

type ListParams = {
	userId: string;
	projectId: string;
	folderId?: string;
};

// > folderId 非空时只返回直接挂载在该文件夹下的配置；卡片标题直接用文件名 name
export const listAgentsMds = async ({
	userId,
	projectId,
	folderId,
}: ListParams): Promise<AgentsMdListVo> => {
	// 先校验项目归属，避免泄漏他人项目下的配置清单
	const project = await prisma.project.findFirst({
		where: { id: projectId, ownerId: userId, teamId: null },
		select: { id: true },
	});
	if (!project) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "项目不存在" });
	}

	const docs = await prisma.agentsMd.findMany({
		where: {
			projectId,
			...(folderId && { folders: { some: { projectFolderId: folderId } } }),
		},
		orderBy: { name: "asc" },
		select: { id: true, name: true, content: true, folders: { select: { projectFolderId: true } } },
	});

	return docs.map((doc) =>
		makeAgentsMdListItem(
			doc.id,
			doc.name,
			doc.content,
			doc.folders.map((f) => f.projectFolderId),
		),
	);
};

// 从配置内容提取摘要（首个非标题正文行，超长截断）；标题直接用文件名 name
export const makeAgentsMdListItem = (
	id: string,
	name: string,
	content: string,
	folderIds: string[],
): AgentsMdListItemVo => {
	const lines = content.split("\n");
	const firstLine = lines.find((line) => line.trim() && !line.startsWith("#")) ?? "";
	const excerpt =
		firstLine.length > EXCERPT_LENGTH ? `${firstLine.slice(0, EXCERPT_LENGTH)}...` : firstLine;
	return { id, name, excerpt, folderIds };
};
