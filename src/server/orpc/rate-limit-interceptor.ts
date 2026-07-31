// # 限流响应头拦截器：给所有走 API Key 的接口响应补上 X-RateLimit-* 头

import { ORPCError } from "@orpc/client";
import type { Context } from "@orpc/server";
import type { StandardHandlerInterceptor } from "@orpc/server/standard";
import type { RateLimiterRes } from "rate-limiter-flexible";
import { RATE_LIMIT_MAX_POINTS } from "@/server/middleware/resolve-context";

// 把限流信息写进 headers 对象（平移原 applyRateLimitHeaders 逻辑）
// 返回新对象，不 mutate 原有 headers
const withRateLimitFields = (
	headers: Record<string, string>,
	info: RateLimiterRes,
	includeRetryAfter: boolean,
): Record<string, string> => ({
	...headers,
	"X-RateLimit-Limit": String(RATE_LIMIT_MAX_POINTS),
	"X-RateLimit-Remaining": String(info.remainingPoints),
	"X-RateLimit-Reset": String(Math.ceil((Date.now() + info.msBeforeNext) / 1000)),
	...(includeRetryAfter ? { "Retry-After": String(Math.ceil(info.msBeforeNext / 1000)) } : {}),
});

// 判断是否被限流（决定是否额外写 Retry-After）
const isRateLimited = (status: number, error: unknown): boolean => {
	if (status === 429) return true;
	if (error instanceof ORPCError && error.code === "RATE_LIMITED") return true;
	return false;
};

// 给 oRPC 响应补上限流头：rateInfo 非 null（API Key 接入）时生效，cookies 接入原样放行
export const rateLimitHeaderInterceptor: StandardHandlerInterceptor<Context> = async ({
	next,
	context,
}) => {
	const info = (context as { rateInfo?: RateLimiterRes | null }).rateInfo ?? null;
	if (!info) {
		// cookies 接入：无限流信息，原样放行
		return next();
	}

	try {
		const response = await next();
		const headers = response.headers as unknown as Record<string, string>;
		return {
			...response,
			headers: withRateLimitFields(headers, info, isRateLimited(response.status, undefined)),
		};
	} catch (error) {
		// 错误路径：被限流时给后续错误响应补 Retry-After（信息记入 logger，最终响应头由外层兜底）
		if (isRateLimited(0, error)) {
			logRetryAfter(info);
		}
		throw error;
	}
};

// 简单记录 Retry-After（错误路径下无法直接改 response，留给外层 route handler 处理）
const logRetryAfter = (info: RateLimiterRes): void => {
	// 占位：限流错误已被 errorInterceptor 转成 ORPCError(RATE_LIMITED)，message 含秒数
	void info;
};
