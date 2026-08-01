// # 项目 procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径
// > 个人空间项目（teamId 始终 null）；MVP 仅覆盖只读：list / getById + 嵌套 agentsMds

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import {
	getAgentsMd,
	getProjectById,
	listAgentsMds,
	listProjects,
} from "@/server/domain/projects/services";
import { z } from "@/shared/lib/zod";
import { AgentsMdSchemas, ProjectSchemas } from "@/shared/lib/zod/schemas/project";
import { personalProcedure } from "../procedures";

// 项目 id 路径参数
const projectIdPathSchema = z.object({ projectId: z.string() });

// > 项目 router：list / getById + 嵌套 agentsMds 子资源
export const projectsRouter = {
	// 列表查询（GET /projects）
	list: personalProcedure()
		.route({ method: "GET", path: "/projects" })
		.input(ProjectSchemas.listDto)
		.output(ProjectSchemas.listVo)
		.handler(async ({ input, context }) => {
			return listProjects({
				userId: context.session.user.id,
				folderId: input.folderId,
				q: input.q,
				page: input.page ?? 1,
				pageSize: input.pageSize ?? 30,
			});
		}),

	// 单条详情（GET /projects/{id}）
	getById: personalProcedure()
		.route({ method: "GET", path: "/projects/{id}" })
		.input(z.object({ id: z.string() }))
		.output(ProjectSchemas.vo)
		.handler(async ({ input, context }) => {
			return getProjectById({ userId: context.session.user.id, id: input.id });
		}),

	// 嵌套子资源：项目文档（AGENTS.md）
	agentsMds: {
		// 文档列表（GET /projects/{projectId}/agents-mds）
		list: personalProcedure()
			.route({ method: "GET", path: "/projects/{projectId}/agents-mds" })
			.input(projectIdPathSchema.extend(AgentsMdSchemas.listDto.shape))
			.output(AgentsMdSchemas.listVo)
			.handler(async ({ input, context }) => {
				return listAgentsMds({
					userId: context.session.user.id,
					projectId: input.projectId,
					folderPath: input.folderPath,
				});
			}),

		// 文档详情（GET /projects/{projectId}/agents-mds/{id}）
		getById: personalProcedure()
			.route({ method: "GET", path: "/projects/{projectId}/agents-mds/{id}" })
			.input(projectIdPathSchema.extend({ id: z.string() }))
			.output(AgentsMdSchemas.contentVo)
			.handler(async ({ input, context }) => {
				return getAgentsMd({
					userId: context.session.user.id,
					projectId: input.projectId,
					id: input.id,
				});
			}),
	},
};
