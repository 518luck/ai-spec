import { z } from "@/shared/lib/zod";

// # 错误码 schema：zod 枚举与 ErrorCode 的单一来源

// @ 错误码常量对象：值等于 key 本身，支持 ErrorCode.NOT_FOUND 点号访问 + IDE 自动补全
export const ErrorCode = {
	VALIDATION_ERROR: "VALIDATION_ERROR", // 参数校验失败
	UNAUTHORIZED: "UNAUTHORIZED", // 未登录（RBAC 预留）
	FORBIDDEN: "FORBIDDEN", // 无权限（RBAC 预留）
	NOT_FOUND: "NOT_FOUND", // 资源不存在
	CONFLICT: "CONFLICT", // 唯一约束冲突等
	RATE_LIMITED: "RATE_LIMITED", // 触发限流
	DATABASE_ERROR: "DATABASE_ERROR", // 数据库其它已知错误
	INTERNAL_ERROR: "INTERNAL_ERROR", // 未知兜底
} as const;

// 错误码类型：从常量对象推导，供 api/error.ts 的状态映射、AiSpecError、ErrorBody 复用
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// zod 枚举：运行时校验外部传入的 code（如 API 响应解析）
export const errorCodeSchema = z.enum([
	ErrorCode.VALIDATION_ERROR,
	ErrorCode.UNAUTHORIZED,
	ErrorCode.FORBIDDEN,
	ErrorCode.NOT_FOUND,
	ErrorCode.CONFLICT,
	ErrorCode.RATE_LIMITED,
	ErrorCode.DATABASE_ERROR,
	ErrorCode.INTERNAL_ERROR,
]);
