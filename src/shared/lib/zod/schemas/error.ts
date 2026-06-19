import * as z from "zod/v4";

// 错误码元组：zod 枚举与 ErrorCode 类型的唯一来源
const ERROR_CODE_NAMES = [
  "VALIDATION_ERROR", // 参数校验失败
  "UNAUTHORIZED", // 未登录（RBAC 预留）
  "FORBIDDEN", // 无权限（RBAC 预留）
  "NOT_FOUND", // 资源不存在
  "CONFLICT", // 唯一约束冲突等
  "RATE_LIMITED", // 触发限流
  "DATABASE_ERROR", // 数据库其它已知错误
  "INTERNAL_ERROR", // 未知兜底
] as const;

// zod 枚举：既做类型推导，也可运行时校验外部传入的 code
export const errorCodeSchema = z.enum(ERROR_CODE_NAMES);

// 错误码类型：供 api/error.ts 的状态映射、AiSpecError、ErrorBody 复用
export type ErrorCode = z.infer<typeof errorCodeSchema>;
