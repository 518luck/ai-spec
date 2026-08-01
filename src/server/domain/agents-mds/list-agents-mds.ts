// # 查询项目文档列表：按 path 升序，支持按文件夹路径前缀筛选；标题/摘要从 content 提取

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { AgentsMdListItemVo, AgentsMdListVo } from "@/shared/lib/zod/schemas/project";

// 摘要截断长度（字符数）
const EXCERPT_LENGTH = 120;

type ListParams = {
	userId: string;
	projectId: string;
	folderPath?: string;
};

// > folderPath 非空时只返回该前缀下的文档；标题取首个 # 行，摘要取首个非标题正文行
export const listAgentsMds = async ({
	userId,
	projectId,
	folderPath,
}: ListParams): Promise<AgentsMdListVo> => {
	// 先校验项目归属，避免泄漏他人项目下的文档清单
	const project = await prisma.project.findFirst({
		where: { id: projectId, ownerId: userId, teamId: null },
		select: { id: true },
	});
	if (!project) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "项目不存在" });
	}

	const trimmedPath = folderPath?.trim() ?? "";
	const docs = await prisma.agentsMd.findMany({
		where: {
			projectId,
			...(trimmedPath && { path: { startsWith: `${trimmedPath}/` } }),
		},
		orderBy: { path: "asc" },
		select: { id: true, path: true, content: true },
	});

	return docs.map((doc) => makeListItem(doc.id, doc.path, doc.content));
};

// 从文档内容提取标题（首个 # 行）与摘要（首个非标题正文行，超长截断）
const makeListItem = (id: string, path: string, content: string): AgentsMdListItemVo => {
	const lines = content.split("\n");
	const title =
		lines
			.find((line) => line.startsWith("# "))
			?.slice(2)
			.trim() || "AGENTS.md";
	const firstLine = lines.find((line) => line.trim() && !line.startsWith("#")) ?? "";
	const excerpt =
		firstLine.length > EXCERPT_LENGTH ? `${firstLine.slice(0, EXCERPT_LENGTH)}...` : firstLine;
	return { id, path, title, excerpt };
};
