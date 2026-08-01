// # 项目文档单条详情：返回全文（阅读态取数用）

import { AiSpecError } from "@/server/errors/http-error";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import type { AgentsMdContentVo } from "@/shared/lib/zod/schemas/project";

export const getAgentsMd = async ({
	userId,
	projectId,
	id,
}: {
	userId: string;
	projectId: string;
	id: string;
}): Promise<AgentsMdContentVo> => {
	// 先校验项目归属，再取文档，避免泄漏他人项目下的文档
	const project = await prisma.project.findFirst({
		where: { id: projectId, ownerId: userId, teamId: null },
		select: { id: true },
	});
	if (!project) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "项目不存在" });
	}

	const doc = await prisma.agentsMd.findFirst({
		where: { id, projectId },
		select: { id: true, path: true, content: true },
	});
	if (!doc) {
		throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "文档不存在" });
	}
	return { id: doc.id, path: doc.path, content: doc.content };
};
