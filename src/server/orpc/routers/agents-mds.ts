// # 项目文档（AGENTS.md）procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径
// > 文档是项目的子资源，projectId 作为必传参数（列表/详情均需先校验项目归属）

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import { getAgentsMd, listAgentsMds } from "@/server/domain/agents-mds";
import { z } from "@/shared/lib/zod";
import { AgentsMdSchemas } from "@/shared/lib/zod/schemas/project";
import { personalProcedure } from "../procedures";

// 文档 id 路径参数
const agentsMdIdPathSchema = z.object({ id: z.string() });

// > 项目文档 router：list / getById（projectId 必传，service 内校验项目归属）
export const agentsMdsRouter = {
	// 文档列表（GET /agents-mds?projectId=...）
	list: personalProcedure()
		.route({ method: "GET", path: "/agents-mds" })
		.input(AgentsMdSchemas.listDto)
		.output(AgentsMdSchemas.listVo)
		.handler(async ({ input, context }) => {
			return listAgentsMds({
				userId: context.session.user.id,
				projectId: input.projectId,
				folderPath: input.folderPath,
			});
		}),

	// 文档详情（GET /agents-mds/{id}?projectId=...）
	getById: personalProcedure()
		.route({ method: "GET", path: "/agents-mds/{id}" })
		.input(agentsMdIdPathSchema.extend({ projectId: z.string() }))
		.output(AgentsMdSchemas.contentVo)
		.handler(async ({ input, context }) => {
			return getAgentsMd({
				userId: context.session.user.id,
				projectId: input.projectId,
				id: input.id,
			});
		}),
};
