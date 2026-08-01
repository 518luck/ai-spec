// # 项目 procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径
// > 个人空间项目（teamId 始终 null）：list / getById / create（文档见 agentsMdsRouter）

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import { createProject, getProjectById, listProjects } from "@/server/domain/projects/services";
import { z } from "@/shared/lib/zod";
import { ProjectSchemas } from "@/shared/lib/zod/schemas/project";
import { personalProcedure } from "../procedures";

// > 项目 router：list / getById / create
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

	// 新建（POST /projects）
	create: personalProcedure()
		.route({ method: "POST", path: "/projects", successStatus: 201 })
		.input(ProjectSchemas.createDto)
		.output(ProjectSchemas.vo)
		.handler(async ({ input, context }) => {
			return createProject({
				userId: context.session.user.id,
				name: input.name,
				description: input.description,
				folderId: input.folderId,
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
};
