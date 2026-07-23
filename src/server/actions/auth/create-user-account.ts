"use server";

import { flattenValidationErrors } from "next-safe-action";
import { v4 as uuidv4 } from "uuid";
import { actionClient } from "@/server/actions/safe-action";
import { ActionError } from "@/server/errors/action-error";
import { skipAuthThrottling } from "@/server/infrastructure/environment";
import { hardDailyRatelimit } from "@/server/infrastructure/redis/reatlimit";
import prisma from "@/shared/db";
import { hashPassword } from "@/shared/lib/utils";
import { z } from "@/shared/lib/zod";
import { signUpDtoSchema } from "@/shared/lib/zod/schemas/auth";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";
import { throwIfAuthenticated } from "./throw-if-authenticated";

// # 创建用户账户 Action：通过邮箱验证码校验注册请求，完成账户创建

// 每次注册尝试消耗的限流积分
const OTP_ATTEMPTS = 2;

const schema = signUpDtoSchema.extend({
	code: z.string().min(6, "OTP must be 6 characters long."),
});

// 通过邮箱验证码验证注册请求
export const createUserAccountAction = actionClient
	.inputSchema(schema, {
		// 把 Zod 校验错误整理成前端更容易消费的字段级错误结构。
		handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
	})
	.use(throwIfAuthenticated)
	.action(async ({ parsedInput }) => {
		const { email, password, code } = parsedInput;

		const signupAttemptKey = `signup:attempts:${email}`;

		if (!skipAuthThrottling) {
			// ! 每日 10 积分，每次消耗 2 点 → 最多尝试 5 次，超额锁到当天窗口结束，防止验证码爆破
			await hardDailyRatelimit({
				key: signupAttemptKey,
				points: OTP_ATTEMPTS,
			});
		}

		const verificationToken = await prisma.emailVerificationToken.findUnique({
			where: {
				identifier: email,
				token: code,
			},
		});

		if (!verificationToken) {
			// ! 验证码错误时累计一次失败次数，配合限流逐步锁定。
			if (!skipAuthThrottling) {
				await hardDailyRatelimit({
					key: signupAttemptKey,
					points: OTP_ATTEMPTS,
				});
			}

			// 验证码不匹配时终止注册。
			throw new ActionError({
				code: ErrorCode.VALIDATION_ERROR,
				message: "输入无效的验证码",
			});
		}

		if (verificationToken.expires && verificationToken.expires < new Date()) {
			// 过期验证码异步清理掉，避免脏数据残留。
			await prisma.emailVerificationToken.delete({
				where: {
					identifier: email,
					token: code,
				},
			});

			// 验证码过期时提示用户重新获取。
			throw new ActionError({
				code: ErrorCode.VALIDATION_ERROR,
				message: "验证码已经过期，请重新发送",
			});
		}

		await prisma.emailVerificationToken.delete({
			where: {
				identifier: email,
				token: code,
			},
		});

		const user = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (!user) {
			const id = uuidv4();
			// 首次注册时创建用户，并保存密码哈希与默认通知配置。
			await prisma.user.create({
				data: {
					id,
					email,
					passwordHash: await hashPassword(password),
					emailVerified: new Date(),
				},
			});
		}

		return parsedInput;
	});
