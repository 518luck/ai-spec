import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import type { RateLimiterRes } from "rate-limiter-flexible";
import { AiSpecError, toErrorResponse } from "@/server/errors/http-error";
import { withAxiom } from "@/server/infrastructure/axiom/server";
import { getSearchParams } from "@/shared/lib/utils";
import { RATE_LIMIT_MAX_POINTS, resolveContext } from "./resolve-context";

// # withSession：带统一鉴权与限流响应头的高阶 route handler

// Next.js App Router 动态路由上下文类型
type RouteContext = { params: Promise<Record<string, string | string[]>> };

// withSession 传给业务 handler 的全部上下文：请求对象、路由上下文、身份 session 与 URL 查询参数
type SessionHandlerArgs = {
	req: NextRequest;
	ctx: RouteContext;
	session: Session;
	searchParams: Record<string, string>;
};

// 被 withSession 包装的业务 handler 签名：接收单一对象参数
type SessionHandler = (args: SessionHandlerArgs) => Promise<Response> | Response;

// 高阶函数：把业务 handler 转换为带统一鉴权、限流与错误封装的 Next.js route handler
export const withSession = (handler: SessionHandler) =>
	withAxiom(async (req: NextRequest, ctx: RouteContext) => {
		let rateInfo: RateLimiterRes | null = null;
		try {
			const resolved = await resolveContext(req);
			rateInfo = resolved.rateInfo;

			const searchParams = getSearchParams(req.url);
			const response = await handler({
				req,
				ctx,
				session: resolved.session,
				searchParams,
			});

			return withRateLimitHeaders(response, rateInfo);
		} catch (e) {
			const headers = new Headers();
			applyRateLimitHeaders(
				headers,
				rateInfo,
				e instanceof AiSpecError && e.code === "RATE_LIMITED",
			);
			return toErrorResponse(e, headers);
		}
	});

// 把限流结果写入响应头；被限流时额外写入 Retry-After
const applyRateLimitHeaders = (
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

// 给业务 handler 的成功响应追加限流响应头
const withRateLimitHeaders = (response: Response, info: RateLimiterRes | null): Response => {
	if (!info) {
		return response;
	}
	const headers = new Headers(response.headers);
	applyRateLimitHeaders(headers, info, false);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
};
