// # 用户资料 procedure 编排层：input 校验 → service → output 校验，声明 OpenAPI 路径
// > 唯一原 withSession 路由（S3 头像 + 邮件验证 + 队列）；迁移后走标准 protectedProcedure，
//   限流响应头已由 rateLimitHeaderInterceptor 统一补上，无需特殊处理

import "@orpc/openapi/extensions/route"; // 启用 .route() 扩展（声明 method + path 给第三方）
import { updateUser } from "@/server/domain/user/services";
import { UserSchemas } from "@/shared/lib/zod/schemas/user";
import { protectedProcedure } from "../procedures";

// > 用户 router：update（name / avatar / email / defaultWorkspace）
export const userRouter = {
	// 更新当前登录用户资料（PATCH /user）
	update: protectedProcedure
		.route({ method: "PATCH", path: "/user" })
		.input(UserSchemas.updateDto)
		.output(UserSchemas.vo)
		.handler(async ({ input, context }) => {
			return updateUser({
				userId: context.session.user.id,
				currentEmail: context.session.user.email ?? "",
				patch: {
					name: input.name,
					email: input.email,
					avatar: input.avatar,
					defaultWorkspace: input.defaultWorkspace,
				},
			});
		}),
};
