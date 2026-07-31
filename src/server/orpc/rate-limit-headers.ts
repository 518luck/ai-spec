// # 限流响应头工具：把限流信息写入响应头，供 oRPC 拦截器和原 withSession 共用

import type { RateLimiterRes } from "rate-limiter-flexible";
import { RATE_LIMIT_MAX_POINTS } from "@/server/middleware/resolve-context";

// 把限流结果写入响应头；被限流时额外写入 Retry-After（平移 with-session.ts 的原逻辑）
export const applyRateLimitHeaders = (
	headers: Headers,
	info: RateLimiterRes | null,
	includeRetryAfter: boolean,
): void => {
	if (!info) {
		return;
	}
	headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX_POINTS));
	headers.set("X-RateLimit-Remaining", String(info.remainingPoints));
	headers.set("X-RateLimit-Reset", String(Math.ceil((Date.now() + info.msBeforeNext) / 1000)));
	if (includeRetryAfter) {
		headers.set("Retry-After", String(Math.ceil(info.msBeforeNext / 1000)));
	}
};

// 给响应追加限流头；info 为空（cookies 接入）时原样返回
export const withRateLimitHeaders = <T extends Response>(
	response: T,
	info: RateLimiterRes | null,
): T => {
	if (!info) {
		return response;
	}
	const headers = new Headers(response.headers);
	applyRateLimitHeaders(headers, info, false);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	}) as T;
};
