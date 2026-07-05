"use server";

import { flattenValidationErrors } from "next-safe-action";
import * as z from "zod/v4";
import { actionClient } from "@/server/actions/safe-action";
import { skipAuthThrottling } from "@/server/infrastructure/environment";
import { ratelimit } from "@/server/infrastructure/redis/reatlimit";
import { getIP } from "@/server/middleware/get-ip";
import prisma from "@/shared/db";
import { emailSchema } from "@/shared/lib/zod/schemas/auth";
import { throwIfAuthenticated } from "./throw-if-authenticated";

const schema = z.object({
	email: emailSchema,
});

// 检查邮箱是否可使用密码登录，避免不存在账户继续调用 NextAuth。
export const checkLoginEmailAction = actionClient
	.inputSchema(schema, {
		// 把邮箱格式错误转换成前端可展示的字段级错误。
		handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
	})
	.use(throwIfAuthenticated)
	.action(async ({ parsedInput }) => {
		const { email } = parsedInput;

		if (!skipAuthThrottling) {
			// 邮箱探测按请求 IP 限流，每分钟最多 5 次。
			await ratelimit({
				key: `login:email-check:${await getIP()}`,
				points: 2,
				duration: 60,
			});
		}

		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				passwordHash: true,
			},
		});

		return {
			isRegistered: user !== null,
			hasPassword: Boolean(user?.passwordHash),
		};
	});
