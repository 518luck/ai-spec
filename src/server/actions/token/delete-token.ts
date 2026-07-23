"use server";

import { flattenValidationErrors } from "next-safe-action";
import { authUserActionClient } from "@/server/actions/safe-action";
import { ActionError } from "@/server/errors/action-error";
import { tokenCache } from "@/server/infrastructure/redis/token-cache";
import prisma from "@/shared/db";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import { deleteTokenDtoSchema } from "@/shared/lib/zod/schemas/token";

// # 删除 API 密钥 Action：校验归属后删除令牌并清除缓存

// 删除 API 密钥：仅登录用户可删除归属自己的令牌；按 id 删除，校验归属防止越权删别人的
export const deleteTokenAction = authUserActionClient
	.inputSchema(deleteTokenDtoSchema, {
		// 把 Zod 校验错误整理成前端更容易消费的字段级错误结构
		handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
	})
	.action(async ({ parsedInput, ctx }) => {
		const { id } = parsedInput;
		const userId = ctx.user.id;

		// 先查确认令牌存在且属于当前用户，并取出 hashedKey 供缓存清理使用
		const token = await prisma.token.findUnique({
			where: { id },
			select: { userId: true, hashedKey: true },
		});
		if (!token) {
			throw new ActionError({ code: ErrorCode.NOT_FOUND, message: "令牌不存在" });
		}
		// ! 归属校验：即便知道别人的令牌 id 也不能删除
		if (token.userId !== userId) {
			throw new ActionError({ code: ErrorCode.FORBIDDEN, message: "无权删除该令牌" });
		}

		await prisma.token.delete({ where: { id } });
		// ! 删除后立即清缓存，避免被 revoke 的 key 在缓存 TTL 内仍能通过鉴权
		await tokenCache.delete(token.hashedKey);
	});
