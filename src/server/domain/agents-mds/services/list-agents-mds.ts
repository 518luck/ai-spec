// # 查询项目配置列表：按 name 升序，支持按文件夹筛选（中间表直接挂载）与关键词搜索；摘要从 content 提取

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { AgentsMdListVo, AgentsMdSearchFieldKey } from "@/shared/lib/zod/schemas/project";
import { makeAgentsMdListItem } from "../lib/agents-md-item";
import { buildSearchWhere } from "../lib/search-keyword";

type ListParams = {
	userId: string;
	projectId: string;
	folderId?: string;
	q?: string;
	fields?: AgentsMdSearchFieldKey[];
};

// > folderId 非空时只返回直接挂载在该文件夹下的配置；q 非空时按字段开关搜名字/内容；卡片标题直接用文件名 name
export const listAgentsMds = async ({
	userId,
	projectId,
	folderId,
	q,
	fields,
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
			...buildSearchWhere(q, fields),
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
