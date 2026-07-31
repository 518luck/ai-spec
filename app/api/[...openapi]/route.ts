// # oRPC OpenAPI 出口：第三方按 REST 路径调用，路径由 procedure 的 .route() 声明

import { OpenAPIHandler } from "@orpc/openapi/fetch";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import { logger } from "@/server/infrastructure/axiom/server";
import { createORPCContext } from "@/server/orpc/context";
import { errorInterceptor } from "@/server/orpc/error-interceptor";
import { loggingInterceptor } from "@/server/orpc/logging-interceptor";
import { rateLimitHeaderInterceptor } from "@/server/orpc/rate-limit-interceptor";
import { appRouter } from "@/server/orpc/router";

// OpenAPI handler：与 RPC handler 共用同一份 appRouter，路径靠各 procedure 的 .route() 声明
const handler = new OpenAPIHandler(appRouter, {
	interceptors: [loggingInterceptor, rateLimitHeaderInterceptor, errorInterceptor],
});

// 处理函数：第三方按 REST 风格调用 /api/<procedure 的 path>
const handle = async (request: NextRequest): Promise<Response> => {
	const context = createORPCContext({ request });
	const { response } = await handler.handle(request, {
		prefix: "/api",
		context,
	});
	after(() => logger.flush());
	return response ?? new Response("Not found", { status: 404 });
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
