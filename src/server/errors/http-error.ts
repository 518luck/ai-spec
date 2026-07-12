import { after, NextResponse } from "next/server";
import { ZodError } from "zod/v4";
import { fromZodError } from "zod-validation-error";
import { createLogger, serializeError } from "@/server/infrastructure/axiom/server";
import { Prisma } from "@/shared/db/generator/client";
import type { ErrorCode } from "@/shared/lib/zod/schemas/error";

// # HTTP 错误处理：把各类原始错误归一化为带 code 的标准响应体

// 错误归一化专用 logger，自动带 module: "ai-spec-error"
const log = createLogger("ai-spec-error");

// @ 错误码 → HTTP 状态码映射
// code → HTTP 状态码映射（原先散落的数字状态码集中到这里）
export const ERROR_CODES: Record<ErrorCode, number> = {
	VALIDATION_ERROR: 400, // 参数校验失败
	UNAUTHORIZED: 401, // 未登录（RBAC 预留）
	FORBIDDEN: 403, // 无权限（RBAC 预留）
	NOT_FOUND: 404, // 资源不存在
	CONFLICT: 409, // 唯一约束冲突等
	RATE_LIMITED: 429, // 触发限流
	DATABASE_ERROR: 500, // 数据库其它已知错误
	INTERNAL_ERROR: 500, // 未知兜底
};

// 标准错误响应体：code 收紧为 ErrorCode 枚举
type ErrorBody = {
	message: string;
	code?: ErrorCode;
};

// 函数 A 的返回值：归一化后的错误体 + 对应 HTTP 状态码
type ErrorResult = {
	error: ErrorBody;
	status: number;
};

// @ 业务自定义错误类
// 业务自定义错误：只传 code 名，status 自动从 ERROR_CODES 查表
export class AiSpecError extends Error {
	readonly status: number;
	readonly code: ErrorCode;

	constructor({ code, message }: { code: ErrorCode; message: string }) {
		super(message);
		this.name = "AiSpecError";
		this.code = code;
		this.status = ERROR_CODES[code];
	}
}

// @ 错误归一化
// 内部转换器：收到原始错误，按类型归一化为 { error, status }，并通过 Axiom 记录日志。
// > 顺序：AiSpecError（业务自定义）→ ZodError（参数校验）→ Prisma（数据库）→ 兜底 INTERNAL_ERROR。
const toError = (e: unknown): ErrorResult => {
	// ① 业务自定义错误：自带 code，status 由 ERROR_CODES 查
	if (e instanceof AiSpecError) {
		log.warn(e.message, { status: e.status, code: e.code });
		after(log.flush());
		return { error: { message: e.message, code: e.code }, status: e.status };
	}

	// ② Zod 校验错误：用 fromZodError 序列化为可读字符串，统一为 VALIDATION_ERROR
	if (e instanceof ZodError) {
		const message = fromZodError(e).message;
		log.warn(message, serializeError(e));
		after(log.flush());
		return {
			error: { message, code: "VALIDATION_ERROR" },
			status: ERROR_CODES.VALIDATION_ERROR,
		};
	}

	// ③ Prisma 已知错误：P2025（记录不存在）→ NOT_FOUND，其余 → DATABASE_ERROR；原始 e.code 只进日志
	if (e instanceof Prisma.PrismaClientKnownRequestError) {
		const code: ErrorCode = e.code === "P2025" ? "NOT_FOUND" : "DATABASE_ERROR";
		log.error(e.message, { code: e.code, meta: e.meta, ...serializeError(e) });
		after(log.flush());
		return { error: { message: e.message, code }, status: ERROR_CODES[code] };
	}

	// ④ 兜底：未知错误统一为 INTERNAL_ERROR
	const message = e instanceof Error ? e.message : String(e);
	log.error(message, e instanceof Error ? serializeError(e) : undefined);
	after(log.flush());
	return {
		error: { message, code: "INTERNAL_ERROR" },
		status: ERROR_CODES.INTERNAL_ERROR,
	};
};

// 函数 B：直接收原始错误，内部转换一次再交给 JSON 封装；headers 可选（用于附加限流响应头等）
export const toErrorResponse = (
	error: unknown,
	headers?: HeadersInit,
): NextResponse<{ error: ErrorBody }> => {
	const result = toError(error);
	return NextResponse.json({ error: result.error }, { status: result.status, headers });
};
