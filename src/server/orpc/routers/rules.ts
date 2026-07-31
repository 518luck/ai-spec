// # 规约 procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import {
	createRule,
	createRuleSpace,
	deleteRule,
	deleteRules,
	getRuleById,
	getRuleVersionDetail,
	listRuleSpaces,
	listRules,
	listRuleVersions,
	updateRule,
} from "@/server/domain/rules/services";
import { z } from "@/shared/lib/zod";
import { RecordSchemas } from "@/shared/lib/zod/schemas/prompt/record";
import { RuleSchemas } from "@/shared/lib/zod/schemas/rule";
import { RuleSpaceSchemas } from "@/shared/lib/zod/schemas/rule-space";
import { personalProcedure } from "../procedures";

// 批量删除入参（原 route.ts 内联 schema，迁移补正式 Dto 前先就近定义）
const batchDeleteDtoSchema = z.object({
	ids: z.array(z.string()).min(1, "至少选择一条规约"),
});

// 版本详情/列表的路径参数（ruleId/versionId 从 URL 取）
const versionPathSchema = z.object({ ruleId: z.string(), versionId: z.string() });
const ruleIdPathSchema = z.object({ ruleId: z.string() });

// > 规约主资源 router：list / create / getById / update / delete / batchDelete
export const rulesRouter = {
	// 列表查询（GET /rules）
	list: personalProcedure()
		.route({ method: "GET", path: "/rules" })
		.input(RuleSchemas.listDto)
		.output(RuleSchemas.listVo)
		.handler(async ({ input, context }) => {
			const tagIds = (input.tagIds ?? "")
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
			return listRules({
				userId: context.session.user.id,
				folderId: input.folderId,
				spaceId: input.spaceId,
				tagIds,
				q: input.q,
				page: input.page ?? 1,
				pageSize: input.pageSize ?? 30,
			});
		}),

	// 创建（POST /rules）
	create: personalProcedure()
		.route({ method: "POST", path: "/rules", successStatus: 201 })
		.input(RuleSchemas.createDto)
		.output(RuleSchemas.vo)
		.handler(async ({ input, context }) => {
			return createRule({
				userId: context.session.user.id,
				name: input.name,
				content: input.content,
				folderId: input.folderId || null,
				spaceId: input.spaceId,
				tags: input.tags,
			});
		}),

	// 单条详情（GET /rules/{id}）
	getById: personalProcedure()
		.route({ method: "GET", path: "/rules/{id}" })
		.input(z.object({ id: z.string() }))
		.output(RuleSchemas.contentVo)
		.handler(async ({ input, context }) => {
			return getRuleById({ userId: context.session.user.id, id: input.id });
		}),

	// 更新（PUT /rules/{id}）：含版本记录
	update: personalProcedure()
		.route({ method: "PUT", path: "/rules/{id}" })
		.input(z.object({ id: z.string() }).extend(RuleSchemas.updateDto.shape))
		.output(RuleSchemas.vo)
		.handler(async ({ input, context }) => {
			const { id, name, content, folderId, tags } = input;
			return updateRule({
				userId: context.session.user.id,
				id,
				patch: { name, content, folderId, tags },
			});
		}),

	// 删除单条（DELETE /rules/{id}）
	delete: personalProcedure()
		.route({ method: "DELETE", path: "/rules/{id}" })
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			await deleteRule({ userId: context.session.user.id, id: input.id });
			return { success: true };
		}),

	// 批量删除（DELETE /rules/batch）
	deleteMany: personalProcedure()
		.route({ method: "DELETE", path: "/rules/batch" })
		.input(batchDeleteDtoSchema)
		.handler(async ({ input, context }) => {
			return deleteRules({
				userId: context.session.user.id,
				ids: input.ids,
			});
		}),

	// 版本列表（GET /rules/{ruleId}/versions）
	versions: {
		list: personalProcedure({ permissions: ["rules.read"] })
			.route({ method: "GET", path: "/rules/{ruleId}/versions" })
			.input(ruleIdPathSchema.extend(RecordSchemas.listVersionsDto.shape))
			.output(RecordSchemas.versionListVo)
			.handler(async ({ input, context }) => {
				return listRuleVersions({
					userId: context.session.user.id,
					ruleId: input.ruleId,
					page: input.page ?? 1,
					pageSize: input.pageSize ?? 20,
				});
			}),

		// 版本详情（GET /rules/{ruleId}/versions/{versionId}）
		detail: personalProcedure({ permissions: ["rules.read"] })
			.route({ method: "GET", path: "/rules/{ruleId}/versions/{versionId}" })
			.input(versionPathSchema)
			.output(RecordSchemas.versionDetailVo)
			.handler(async ({ input, context }) => {
				return getRuleVersionDetail({
					userId: context.session.user.id,
					ruleId: input.ruleId,
					versionId: input.versionId,
				});
			}),
	},
};

// > 规约领域空间 router：独立资源，带 RBAC scope
export const ruleSpacesRouter = {
	// 列表（GET /rule-spaces）
	list: personalProcedure({ permissions: ["rules.read"] })
		.route({ method: "GET", path: "/rule-spaces" })
		.output(RuleSpaceSchemas.listVo)
		.handler(async ({ context }) => {
			return listRuleSpaces(context.session.user.id);
		}),

	// 新建（POST /rule-spaces）
	create: personalProcedure({ permissions: ["rules.write"] })
		.route({ method: "POST", path: "/rule-spaces", successStatus: 201 })
		.input(RuleSpaceSchemas.createDto)
		.output(RuleSpaceSchemas.vo)
		.handler(async ({ input, context }) => {
			return createRuleSpace({
				userId: context.session.user.id,
				name: input.name,
				icon: input.icon,
				color: input.color,
			});
		}),
};
