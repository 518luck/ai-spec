// # OpenAPI 规范导出：给第三方生成 SDK 或查阅 Swagger 文档用

import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { appRouter } from "@/server/orpc/router";

// 从 appRouter 生成 OpenAPI 3.1 规范，zod schema 自动转 JSON schema
const generator = new OpenAPIGenerator({
	converters: [new ZodToJsonSchemaConverter()],
});

// GET /api/openapi-spec：返回完整 OpenAPI JSON
export const GET = async (): Promise<Response> => {
	const spec = await generator.generate(appRouter, {
		base: {
			info: {
				title: "AI Spec API",
				version: "1.0.0",
				description: "AI Spec 后端接口（RPC + OpenAPI 双导出）",
			},
			servers: [{ url: "/api" }],
		},
	});
	return Response.json(spec);
};
