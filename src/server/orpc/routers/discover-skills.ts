// # 发现广场 skills procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import {
	createDiscoverSkillReport,
	importRepoSkills,
	listDiscoverOrganizations,
	listDiscoverSkills,
} from "@/server/domain/discover/skills";
import { AiSpecError } from "@/server/errors/http-error";
import { ratelimit } from "@/server/infrastructure/redis/reatlimit";
import { z } from "@/shared/lib/zod";
import { DiscoverSkillSchemas } from "@/shared/lib/zod/schemas/discover-skill";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import { personalProcedure } from "../procedures";

// 反馈路径参数（id 从 URL 取）
const skillIdPathSchema = z.object({ id: z.string() });

// > 广场 skill 主资源 router：list / import / report
export const discoverSkillsRouter = {
	// 列表查询（GET /discover/skills）—— 广场公共索引，无 ownerId 隔离
	list: personalProcedure({ permissions: ["discover.read"] })
		.route({ method: "GET", path: "/discover/skills" })
		.input(DiscoverSkillSchemas.listDto)
		.output(DiscoverSkillSchemas.listVo)
		.handler(async ({ input }) => {
			return listDiscoverSkills({
				q: input.q,
				filter: input.filter,
				orgs: input.orgs,
				minStars: input.minStars,
				page: input.page ?? 1,
			});
		}),

	// 按 GitHub 链接导入（POST /discover/skills/import，201）
	// > 复用现有 importRepoSkills（与每日同步共用：抓取 → upsert → prune → 登记货源），重复导入即刷新
	import: personalProcedure({ permissions: ["discover.write"] })
		.route({ method: "POST", path: "/discover/skills/import", successStatus: 201 })
		.input(DiscoverSkillSchemas.importDto)
		.output(DiscoverSkillSchemas.importVo)
		.handler(async ({ input }) => {
			const { saved } = await importRepoSkills({ url: input.url, addedFrom: "user-import" });
			return { imported: saved.length, skills: saved };
		}),

	// 提交单条 skill 反馈（POST /discover/skills/{id}/report，201）
	// ! 应用级限流（每用户 60 秒 10 次）保留在 procedure handler 里：它是该端点专属、非全局策略
	// > 复用现有 createDiscoverSkillReport：只收集入库，不自动下架；唯一约束 P2002→CONFLICT
	report: personalProcedure({ permissions: ["discover.read"] })
		.route({ method: "POST", path: "/discover/skills/{id}/report", successStatus: 201 })
		.input(skillIdPathSchema.extend(DiscoverSkillSchemas.reportDto.shape))
		.output(DiscoverSkillSchemas.reportVo)
		.handler(async ({ input, context }) => {
			// 防刷：每用户 60 秒内最多 10 次反馈提交
			try {
				await ratelimit({ key: `discover-skill-report:${context.session.user.id}` });
			} catch (error) {
				throw new AiSpecError({
					code: ErrorCode.RATE_LIMITED,
					message: error instanceof Error ? error.message : "请求过于频繁，请稍后再试",
				});
			}

			return createDiscoverSkillReport({
				skillId: input.id,
				reporterId: context.session.user.id,
				reason: input.reason,
				detail: input.detail,
			});
		}),
};

// > 广场组织 router：独立资源，供前端侧边栏筛选
export const discoverOrganizationsRouter = {
	// 组织列表（GET /discover/skills/organizations）—— raw SQL GROUP BY 聚合
	list: personalProcedure({ permissions: ["discover.read"] })
		.route({ method: "GET", path: "/discover/skills/organizations" })
		.output(DiscoverSkillSchemas.organizationListVo)
		.handler(async () => {
			return listDiscoverOrganizations();
		}),
};
