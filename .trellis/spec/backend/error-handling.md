# 错误处理

> 权威源：`app/api/AGENTS.md`。

## 统一抛 AiSpecError

业务错误一律抛 `AiSpecError`，**不要**在 handler 里手写 `NextResponse.json({ error: ... })`。`withPersonal` / `withSession` 会 catch 并经 `toErrorResponse` 统一返回 `{ error: { message, code } }`。

```ts
import { AiSpecError } from "@/server/errors/http-error";
import { ErrorCode } from "@/shared/lib/zod/schemas/error";

throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "记录不存在" });
```

定义位置：

- `AiSpecError` / `toErrorResponse` / `ERROR_CODES`（code→HTTP 状态映射）：`src/server/errors/http-error.ts`
- `ErrorCode` 枚举（唯一来源）：`src/shared/lib/zod/schemas/error.ts`

## ErrorCode 与 HTTP 状态

| code | 用途 |
| --- | --- |
| `VALIDATION_ERROR` | 入参校验失败 |
| `UNAUTHORIZED` | 未登录 |
| `FORBIDDEN` | 无权限 |
| `NOT_FOUND` | 资源不存在 |
| `CONFLICT` | 业务冲突（如重名）|
| `RATE_LIMITED` | 限流 |
| `DATABASE_ERROR` | 数据库错误 |
| `INTERNAL_ERROR` | 内部错误 |

具体 code → HTTP 状态码映射见 `ERROR_CODES`（`src/server/errors/http-error.ts:15`）。

## 抛错要点

- 用 Options Object 构造：`new AiSpecError({ code, message })`。
- 选语义最贴切的 code（资源不存在 `NOT_FOUND`、业务冲突 `CONFLICT`、无权限 `FORBIDDEN`）。
- 错误处理只在实际操作处 try/catch；异步逻辑保持线性，避免嵌套 try。
- 能用 `?? ""` 等回退解决就不要 throw。

## 反模式

- handler 里 `return NextResponse.json({ error: "..." }, { status: 400 })`。
- 抛裸 `Error` / `new Error()`（绕过 code 映射与统一响应）。
- 静默 catch（吞错）——捕获后要么 log 要么 rethrow 要么转成 `AiSpecError`。
