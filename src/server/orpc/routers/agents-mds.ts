// # 项目配置（AGENTS.md）procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径
// > 配置是项目的子资源，projectId 作为必传参数（列表/详情均需先校验项目归属）

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import {
	createAgentsMd,
	getAgentsMd,
	listAgentsMds,
	listAllAgentsMds,
} from "@/server/domain/agents-mds/services";
import { z } from "@/shared/lib/zod";
import { AgentsMdSchemas } from "@/shared/lib/zod/schemas/project";
import { personalProcedure } from "../procedures";

// 配置 id 路径参数
const agentsMdIdPathSchema = z.object({ id: z.string() });

// > 项目配置 router：list / getById / create / 全项目搜索（projectId 必传，service 内校验项目归属）
export const agentsMdsRouter = {
	// 配置列表（GET /agents-mds?projectId=...&q=...&fields=...）
	list: personalProcedure()
		.route({ method: "GET", path: "/agents-mds" })
		.input(AgentsMdSchemas.listDto)
		.output(AgentsMdSchemas.listVo)
		.handler(async ({ input, context }) => {
			return listAgentsMds({
				userId: context.session.user.id,
				projectId: input.projectId,
				folderId: input.folderId,
				q: input.q,
				fields: input.fields,
			});
		}),

	// 全项目搜索（GET /agents-mds/search?q=...&fields=...）：跨当前用户全部项目，结果带项目归属
	listAll: personalProcedure()
		.route({ method: "GET", path: "/agents-mds/search" })
		.input(AgentsMdSchemas.listAllDto)
		.output(AgentsMdSchemas.listAllVo)
		.handler(async ({ input, context }) => {
			return listAllAgentsMds({
				userId: context.session.user.id,
				q: input.q,
				fields: input.fields,
			});
		}),

	// 配置详情（GET /agents-mds/{id}?projectId=...）
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

	// 新建配置（POST /agents-mds）
	create: personalProcedure()
		.route({ method: "POST", path: "/agents-mds", successStatus: 201 })
		.input(AgentsMdSchemas.createDto)
		.output(AgentsMdSchemas.listItemVo)
		.handler(async ({ input, context }) => {
			return createAgentsMd({
				userId: context.session.user.id,
				projectId: input.projectId,
				folderId: input.folderId,
				name: input.name,
			});
		}),
};
