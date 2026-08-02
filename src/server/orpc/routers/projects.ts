// # 项目 procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径
// > 个人空间项目（teamId 始终 null）：list / getById / create + 项目内文件夹子路由
//   （配置见 agentsMdsRouter；项目内文件夹区别于 folders router 的个人空间分组文件夹）

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import {
	createProject,
	createProjectFolder,
	getProjectById,
	listProjectFolders,
	listProjects,
} from "@/server/domain/projects/services";
import { z } from "@/shared/lib/zod";
import { ProjectFolderSchemas, ProjectSchemas } from "@/shared/lib/zod/schemas/project";
import { personalProcedure } from "../procedures";

// > 项目 router：list / getById / create + 项目内文件夹子路由
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

	// 项目内文件夹子路由：list / create（项目的子资源，projectId 必传）
	projectFolders: {
		// 文件夹列表（GET /projects/project-folders?projectId=...）
		list: personalProcedure()
			.route({ method: "GET", path: "/projects/project-folders" })
			.input(ProjectFolderSchemas.listDto)
			.output(ProjectFolderSchemas.listVo)
			.handler(async ({ input, context }) => {
				return listProjectFolders({
					userId: context.session.user.id,
					projectId: input.projectId,
				});
			}),

		// 新建文件夹（POST /projects/project-folders）
		create: personalProcedure()
			.route({ method: "POST", path: "/projects/project-folders", successStatus: 201 })
			.input(ProjectFolderSchemas.createDto)
			.output(ProjectFolderSchemas.listItemVo)
			.handler(async ({ input, context }) => {
				return createProjectFolder({
					userId: context.session.user.id,
					projectId: input.projectId,
					parentId: input.parentId,
					name: input.name,
				});
			}),
	},
};
