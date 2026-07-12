"use server";

import { flattenValidationErrors } from "next-safe-action";
import { authUserActionClient } from "@/server/actions/safe-action";
import { ActionError } from "@/server/errors/action-error";
import { tokenCache } from "@/server/infrastructure/redis/token-cache";
import prisma from "@/shared/db";
import { updateTokenDtoSchema } from "@/shared/lib/zod/schemas/token";

// # 更新 API 密钥 Action：校验归属后更新令牌元信息并清除缓存

// 更新 API 密钥：仅登录用户可改归属自己的令牌；可改 name/description/scopes，密钥本身不可改
export const updateTokenAction = authUserActionClient
	.inputSchema(updateTokenDtoSchema, {
		// 把 Zod 校验错误整理成前端更容易消费的字段级错误结构
		handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
	})
	.action(async ({ parsedInput, ctx }) => {
		const { id, name, description, scopes, expires } = parsedInput;
		const userId = ctx.user.id;

		// 先查确认令牌存在且属于当前用户，并取出 hashed_key 供缓存清理使用
		const token = await prisma.token.findUnique({
			where: { id },
			select: { user_id: true, hashed_key: true },
		});
		if (!token) {
			throw new ActionError({ code: "NOT_FOUND", message: "令牌不存在" });
		}
		// ! 归属校验：即便知道别人的令牌 id 也不能改
		if (token.user_id !== userId) {
			throw new ActionError({ code: "FORBIDDEN", message: "无权修改该令牌" });
		}

		// 落库：scopes 数组按空格拼接（与创建逻辑一致），空数组存为 null；空描述存为 null；expires 为 null 表示永不过期
		await prisma.token.update({
			where: { id },
			data: {
				name,
				description: description || null,
				scopes: scopes.length > 0 ? scopes.join(" ") : null,
				expires: expires ?? null,
			},
		});
		// scopes 可能变化，清缓存让下次请求重新拉取最新值
		await tokenCache.delete(token.hashed_key);
	});
