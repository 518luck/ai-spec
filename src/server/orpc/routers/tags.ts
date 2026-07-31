// # 标签 procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径
// > 个人空间标签（teamId 始终 null）；与原 app/api/tags/route.ts 等价，源码未挂 permissions，保持一致

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import { listTags, upsertTag } from "@/server/domain/tags/services";
import { z } from "@/shared/lib/zod";
import { TagSchemas } from "@/shared/lib/zod/schemas/tag";
import { personalProcedure } from "../procedures";

// 列表查询入参（源 route.ts 直接读 searchParams 未走 zod，迁移补正式 input 校验）
const listTagsDtoSchema = z.object({
	type: TagSchemas.resourceType.optional(),
});

// > 标签 router：list / create（create 走 service.upsert：同名复用并更新 color）
export const tagsRouter = {
	// 列表查询（GET /tags）
	list: personalProcedure()
		.route({ method: "GET", path: "/tags" })
		.input(listTagsDtoSchema)
		.output(TagSchemas.listVo)
		.handler(async ({ input, context }) => {
			return listTags({
				userId: context.session.user.id,
				type: input.type,
			});
		}),

	// 新建/复用（POST /tags）：upsert 语义——同名存在则更新 color，不存在则新建
	create: personalProcedure()
		.route({ method: "POST", path: "/tags", successStatus: 201 })
		.input(TagSchemas.createDto)
		.output(TagSchemas.optionVo)
		.handler(async ({ input, context }) => {
			return upsertTag({
				userId: context.session.user.id,
				name: input.name,
				color: input.color,
				resourceType: input.resourceType,
			});
		}),
};
