"use server";

import { flattenValidationErrors } from "next-safe-action";
import { authUserActionClient } from "@/server/actions/safe-action";
import { ActionError } from "@/server/actions/utils/action-error";
import prisma from "@/shared/db";
import { updateTokenDtoSchema } from "@/shared/lib/zod/schemas/token";

// 更新 API 密钥：仅登录用户可改归属自己的令牌；可改 name/description/scopes，密钥本身不可改
export const updateTokenAction = authUserActionClient
	.inputSchema(updateTokenDtoSchema, {
		// 把 Zod 校验错误整理成前端更容易消费的字段级错误结构
		handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
	})
	.action(async ({ parsedInput, ctx }) => {
		const { id, name, description, scopes } = parsedInput;
		const userId = ctx.user.id;

		// 先查确认令牌存在且属于当前用户，不存在则报 NOT_FOUND
		const token = await prisma.token.findUnique({
			where: { id },
			select: { user_id: true },
		});
		if (!token) {
			throw new ActionError({ code: "NOT_FOUND", message: "令牌不存在" });
		}
		// 归属校验：即便知道别人的令牌 id 也不能改
		if (token.user_id !== userId) {
			throw new ActionError({ code: "FORBIDDEN", message: "无权修改该令牌" });
		}

		// 落库：scopes 数组按空格拼接（与创建逻辑一致），空数组存为 null；空描述存为 null
		await prisma.token.update({
			where: { id },
			data: {
				name,
				description: description || null,
				scopes: scopes.length > 0 ? scopes.join(" ") : null,
			},
		});
	});
