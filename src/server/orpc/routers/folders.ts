// # 文件夹 procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径
// > 个人空间文件夹（teamId 始终 null）；与原 app/api/folders/route.ts 等价，源码未挂 permissions，保持一致

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import { createFolder, listFolders } from "@/server/domain/folders/services";
import { z } from "@/shared/lib/zod";
import {
	createFolderDtoSchema,
	folderListVoSchema,
	folderOptionVoSchema,
	folderResourceTypeSchema,
} from "@/shared/lib/zod/schemas/folder";
import { personalProcedure } from "../procedures";

// 列表查询入参（源 route.ts 直接读 searchParams 未走 zod，迁移补正式 input 校验）
const listFoldersDtoSchema = z.object({
	type: folderResourceTypeSchema.optional(),
	spaceId: z.string().optional(),
});

// > 文件夹 router：list / create
export const foldersRouter = {
	// 列表查询（GET /folders）
	list: personalProcedure()
		.route({ method: "GET", path: "/folders" })
		.input(listFoldersDtoSchema)
		.output(folderListVoSchema)
		.handler(async ({ input, context }) => {
			return listFolders({
				userId: context.session.user.id,
				type: input.type,
				spaceId: input.spaceId,
			});
		}),

	// 新建（POST /folders）
	create: personalProcedure()
		.route({ method: "POST", path: "/folders", successStatus: 201 })
		.input(createFolderDtoSchema)
		.output(folderOptionVoSchema)
		.handler(async ({ input, context }) => {
			return createFolder({
				userId: context.session.user.id,
				name: input.name,
				description: input.description,
				color: input.color,
				resourceType: input.resourceType,
				spaceId: input.spaceId,
			});
		}),
};
