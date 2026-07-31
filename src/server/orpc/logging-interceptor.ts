// # oRPC 请求级日志拦截器：平移 withAxiomBodyLog，记录 method/path/status

import type { Context } from "@orpc/server";
import type { StandardHandlerInterceptor } from "@orpc/server/standard";
import { createLogger } from "@/server/infrastructure/axiom/server";

// 请求级日志专用 logger
const log = createLogger("orpc-request");

// 按状态码选择对应日志方法（ScopedLogger 无通用 log，按级别直接调对应方法）
type LogFn = (msg: string, fields?: Record<string, unknown>) => void;
const pickLogFn = (status: number): LogFn => {
	if (status >= 500) return log.error;
	if (status >= 400) return log.warn;
	return log.info;
};

// 记录每次 oRPC 调用的 method/path 和最终状态
// 用 StandardHandlerInterceptor 类型标注，让签名匹配 RPCHandler/OpenAPIHandler 期望
// ! flush 不在此调：after() 在 oRPC 内不可用，统一由外层 route handler 的 after() 触发
export const loggingInterceptor: StandardHandlerInterceptor<Context> = async ({ next, path }) => {
	const startedAt = Date.now();
	const pathStr = path.join(".");

	try {
		const response = await next();
		const status = response.status;
		pickLogFn(status)(`${pathStr}`, {
			path: pathStr,
			status,
			durationMs: Date.now() - startedAt,
		});
		return response;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		log.error(`${pathStr} 失败: ${message}`, {
			path: pathStr,
			durationMs: Date.now() - startedAt,
			error: message,
		});
		throw error;
	}
};
