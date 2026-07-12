import { after } from "next/server";
import { createSafeActionClient } from "next-safe-action";
import { ActionError } from "@/server/errors/action-error";
import { createLogger, serializeError } from "@/server/infrastructure/axiom/server";
import { auth } from "@/shared/lib/auth/auth";

// # Safe Action 客户端：统一封装 Server Action 的异常处理与鉴权上下文

// Server Action 专用日志器，每条日志自动带 module: "server-action"
const log = createLogger("server-action");

// 统一处理 Server Action 里的异常：记录日志，并对内部错误脱敏
export const actionClient = createSafeActionClient({
	handleServerError: async (e) => {
		log.error(e.message, serializeError(e));

		after(log.flush());

		// ActionError 是预期内的业务错误，可直接返回给前端
		if (e instanceof ActionError) {
			return e.message;
		}

		// ! 其他未预期错误（数据库、网络、库内部等）不暴露原始信息，避免泄露内部实现
		return "服务器出错，请稍后重试";
	},
});

// ! 鉴权客户端：要求调用者已登录，并把 user 注入 ctx 供后续 action 使用
export const authUserActionClient = actionClient.use(async ({ next }) => {
	const session = await auth();

	// ! 未登录会话直接拒绝，所有依赖此客户端的 action 都受保护
	if (!session?.user.id) {
		throw new ActionError({ code: "UNAUTHORIZED", message: "请先登录" });
	}

	return next({
		ctx: {
			user: session.user,
		},
	});
});
