// # oRPC 错误归一化拦截器：把各类原始错误统一转成 ORPCError，平移现有 toError 逻辑

import { ORPCError } from "@orpc/client";
import { ValidationError } from "@orpc/contract";
import type { Context } from "@orpc/server";
import type { StandardHandlerInterceptor } from "@orpc/server/standard";
import { ZodError } from "zod/v4";
import { fromZodError } from "zod-validation-error";
import { AiSpecError } from "@/server/errors/http-error";
import { createLogger, serializeError } from "@/server/infrastructure/axiom/server";
import { Prisma } from "@/shared/db/generator/client";

// 错误归一化专用 logger，自动带 module: "ai-spec-error"
const log = createLogger("ai-spec-error");

// 归一化拦截器：捕获 handler/middleware 抛出的原始错误，按类型转成 ORPCError
// ! flush 不在这里调：after() 在 oRPC handler 内不可用，统一由外层 route handler 的 after() 触发
export const errorInterceptor: StandardHandlerInterceptor<Context> = async ({ next }) => {
	try {
		return await next();
	} catch (error) {
		// ① 业务自定义错误：自带 code，透传 message
		if (error instanceof AiSpecError) {
			log.warn(error.message, { status: error.status, code: error.code });
			throw new ORPCError(error.code, { message: error.message, cause: error });
		}

		// ② 直接抛的 ZodError（handler 内手 safeParse 失败时）：可读化后转 VALIDATION_ERROR
		if (error instanceof ZodError) {
			const message = fromZodError(error).message;
			log.warn(message, serializeError(error));
			throw new ORPCError("VALIDATION_ERROR", { message, cause: error });
		}

		// ③ oRPC 内置校验错误（.input/.output 失败）：cause 是 ValidationError，转成项目的 VALIDATION_ERROR
		if (error instanceof ORPCError && error.cause instanceof ValidationError) {
			const zodError = new ZodError(error.cause.issues as never);
			const message = fromZodError(zodError).message;
			log.warn(message, serializeError(zodError));
			throw new ORPCError("VALIDATION_ERROR", { message, cause: error });
		}

		// ④ Prisma 已知错误：P2025（记录不存在）→ NOT_FOUND，其余 → DATABASE_ERROR
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			const code = error.code === "P2025" ? "NOT_FOUND" : "DATABASE_ERROR";
			log.error(error.message, { code: error.code, meta: error.meta, ...serializeError(error) });
			throw new ORPCError(code, { message: error.message, cause: error });
		}

		// ⑤ 已经是 ORPCError 的（如中间件抛的 UNAUTHORIZED/FORBIDDEN）：原样透传，只记日志
		if (error instanceof ORPCError) {
			log.warn(error.message, { code: error.code });
			throw error;
		}

		// ⑥ 兜底：未知错误统一为 INTERNAL_ERROR
		const message = error instanceof Error ? error.message : String(error);
		log.error(message, error instanceof Error ? serializeError(error) : undefined);
		throw new ORPCError("INTERNAL_ERROR", { message, cause: error as Error });
	}
};
