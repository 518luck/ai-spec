// # oRPC RPC 出口：前端 typed client 的单入口，所有前端调用走这里

import { RPCHandler } from "@orpc/server/fetch";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import { logger } from "@/server/infrastructure/axiom/server";
import { createORPCContext } from "@/server/orpc/context";
import { errorInterceptor } from "@/server/orpc/error-interceptor"; //把 AiSpecError/ZodError/Prisma 错误统一转成 ORPCError
import { loggingInterceptor } from "@/server/orpc/logging-interceptor"; //记录每次调用的 path/status/耗时
import { rateLimitHeaderInterceptor } from "@/server/orpc/rate-limit-interceptor"; //给 API Key 请求的响应补 X-RateLimit-* 头
import { appRouter } from "@/server/orpc/router";

// RPC handler：挂载 appRouter，注册拦截器链（顺序：日志 → 限流头 → 错误归一化）
const handler = new RPCHandler(appRouter, {
	interceptors: [loggingInterceptor, rateLimitHeaderInterceptor, errorInterceptor],
});

// 处理函数：从原始请求构造 context，交给 handler 路由到对应 procedure
const handle = async (request: NextRequest): Promise<Response> => {
	const context = createORPCContext({ request });
	const { response } = await handler.handle(request, {
		prefix: "/api/rpc",
		context,
	});
	// ! after() 在 route handler 生命周期内有效：请求结束后异步 flush 日志，不阻塞响应
	after(() => logger.flush());
	return response ?? new Response("Not found", { status: 404 });
};

export const GET = handle;
export const POST = handle;
