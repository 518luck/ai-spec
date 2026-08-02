// # 全项目搜索：跨当前用户全部项目搜索配置（名字/内容），结果带项目归属供卡片标注

import prisma from "@/shared/db";
import type {
	AgentsMdSearchFieldKey,
	AgentsMdSearchListVo,
} from "@/shared/lib/zod/schemas/project";
import { makeAgentsMdListItem } from "../lib/agents-md-item";
import { buildSearchWhere } from "../lib/search-keyword";

type ListAllParams = {
	userId: string;
	q: string;
	fields?: AgentsMdSearchFieldKey[];
};

// > 项目归属直接在 where 里过滤（只搜当前用户的个人项目），无需先查项目列表；结果按项目分组、组内按名字排序
export const listAllAgentsMds = async ({
	userId,
	q,
	fields,
}: ListAllParams): Promise<AgentsMdSearchListVo> => {
	const docs = await prisma.agentsMd.findMany({
		where: {
			project: { ownerId: userId, teamId: null },
			...buildSearchWhere(q, fields),
		},
		orderBy: [{ projectId: "asc" }, { name: "asc" }],
		select: {
			id: true,
			name: true,
			content: true,
			projectId: true,
			project: { select: { name: true } },
		},
	});

	return docs.map((doc) => ({
		// 全项目结果无文件夹上下文，folderIds 置空
		...makeAgentsMdListItem(doc.id, doc.name, doc.content, []),
		projectId: doc.projectId,
		projectName: doc.project.name,
	}));
};
