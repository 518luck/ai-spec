// # oRPC 请求上下文：把现有 resolveContext 鉴权内核平移到 oRPC context

import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import type { RateLimiterRes } from "rate-limiter-flexible";

// oRPC 初始 context：挂载时由 route handler 传入原始请求，身份字段留待 authProvider 注入
// session/rateInfo/scopes 初始可选——authMiddleware 执行后才填上（官方 dedupe 中间件模式）
export type ORPCContext = {
	request: NextRequest; // 原始请求对象：cookies 鉴权和 Bearer API Key 都依赖它
	session?: Session; // 用户身份：authProvider 调 resolveContext 解析后注入，procedure 从中取 user.id
	rateInfo?: RateLimiterRes | null; // API Key 限流信息：限流头拦截器从中读剩余积分写响应头
	scopes?: string[] | null; // API Key 权限范围：null 表示 cookies 接入（跳过 scope 校验），数组表示 API Key 接入
	authLoaded?: boolean; // 身份是否已解析：dedupe 标志，避免同一请求重复解析身份（重复消耗限流积分）
};

// 挂载 handler 时调用：只放 request，身份解析交给 authProvider 按需执行
export const createORPCContext = ({ request }: { request: NextRequest }): ORPCContext => ({
	request,
});
