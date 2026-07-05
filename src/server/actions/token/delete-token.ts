"use server";

import { flattenValidationErrors } from "next-safe-action";
import { authUserActionClient } from "@/server/actions/safe-action";
import { ActionError } from "@/server/errors/action-error";
import prisma from "@/shared/db";
import { deleteTokenDtoSchema } from "@/shared/lib/zod/schemas/token";

// 删除 API 密钥：仅登录用户可删除归属自己的令牌；按 id 删除，校验归属防止越权删别人的
export const deleteTokenAction = authUserActionClient
	.inputSchema(deleteTokenDtoSchema, {
		// 把 Zod 校验错误整理成前端更容易消费的字段级错误结构
		handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
	})
	.action(async ({ parsedInput, ctx }) => {
		const { id } = parsedInput;
		const userId = ctx.user.id;

		// 先查确认令牌存在且属于当前用户，不存在则报 NOT_FOUND
		const token = await prisma.token.findUnique({
			where: { id },
			select: { user_id: true },
		});
		if (!token) {
			throw new ActionError({ code: "NOT_FOUND", message: "令牌不存在" });
		}
		// 归属校验：即便知道别人的令牌 id 也不能删除
		if (token.user_id !== userId) {
			throw new ActionError({ code: "FORBIDDEN", message: "无权删除该令牌" });
		}

		await prisma.token.delete({ where: { id } });
	});
