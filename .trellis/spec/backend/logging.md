# 日志（Axiom）

> 权威源：`src/server/infrastructure/axiom/AGENTS.md`。正式日志**不用 `console.log`**（临时调试可用）。

## 业务日志：createLogger(module)

```ts
import { createLogger } from "@/server/infrastructure/axiom/server";

const log = createLogger("UserService");
log.info("用户登录成功", { userId: "123" });
log.error("登录失败", { email, error: err.message });
```

- 返回带 `module` 上下文的 ScopedLogger（`src/server/infrastructure/axiom/server.ts:68`）。
- 传**结构化对象**做上下文，不要字符串拼接：`log.info("订单创建", { orderId, userId })`，不要 `` log.info(`订单 ${orderId}`) ``。
- 底层基于 `@axiomhq/logging` + `@axiomhq/nextjs`。

## Route Handler 日志：withAxiomBodyLog / withAxiom

Route Handler 用 `withPersonal`/`withSession` 包裹，内部已含 `withAxiomBodyLog`/`withAxiom`（定义 `src/server/infrastructure/axiom/server.ts:92`/`:130`），自动记录请求/响应体。**不要**在 handler 里额外手写请求体日志。

```ts
export const POST = withAxiomBodyLog(handler); // 一般不直接用，经 withPersonal/withSession
```

## 本地日志文件（开发环境）

开发环境（`NODE_ENV !== "production"`）`createLogger` 额外把每条日志写入项目根 `logs/server.log`（单行可读文本）：

```
2026-07-01 16:51:13.212 ERROR [server-action] column "hashed_key" does not exist {"stack":"..."}
```

- 仅开发环境落盘，生产不写本地文件。
- `logs/` 已在 `.gitignore`，不提交。
- 排查问题时直接翻 `logs/server.log` 或提供给 AI。

## 日志内容规范

**记录**：外部 API 调用的请求/响应、数据库写操作、认证事件、业务关键操作、错误与异常。
**谨慎**：用户输入（脱敏 PII）、请求载荷（脱敏密钥）。
**绝不**：密码、token、信用卡号、API key、密钥。

| 级别 | 用途 | 示例 |
| --- | --- | --- |
| `debug` | 开发诊断 | 变量值、流程跟踪 |
| `info` | 正常操作 | 订单创建、用户登录 |
| `warn` | 可恢复问题 | 限流临近、重试 |
| `error` | 需关注故障 | API 调用失败、数据库错误 |

## 批量操作日志

批量任务记录总数 / 成功 / 失败计数；部分失败时 `warn` 汇总失败原因。

## 反模式

- 正式日志用 `console.log`。
- 字符串拼接上下文（`log.info(\`user ${id}\`)`）。
- 记录敏感信息（token / 密钥 / PII 原文）。
