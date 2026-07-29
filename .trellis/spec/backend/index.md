# 后端规范（backend）

> 后端入口在 `app/api/**`，后端实现在 `src/server/**`（middleware / errors / rbac / actions / infrastructure），共享基础设施在 `src/shared/lib/**`（auth / zod / infrastructure）。权威源：`app/api/AGENTS.md`、`src/shared/lib/AGENTS.md` 及各 `src/server/infrastructure/*/AGENTS.md`。

## 技术栈

- Next.js 16 Route Handler（非 oRPC / tRPC）
- ORM：**Prisma**（`@/shared/db` 单例，多 schema）
- 认证：**NextAuth v5**
- Server Actions：**next-safe-action**
- 校验：**Zod v4**
- 日志：**Axiom**
- 队列：**BullMQ** + ioredis
- 存储：S3；邮件：Resend / react-email

## 文档索引

| 文件 | 内容 | 优先级 |
| --- | --- | --- |
| [directory-structure.md](./directory-structure.md) | `app/api` 薄入口 + `src/server` 分层 | **必读** |
| [route-handlers.md](./route-handlers.md) | Route Handler + `withPersonal`/`withSession` + `withAxiomBodyLog` | **必读** |
| [error-handling.md](./error-handling.md) | `AiSpecError` + `ErrorCode` + `toErrorResponse` | **必读** |
| [authentication.md](./authentication.md) | NextAuth v5：`auth()` / `resolveContext` / RBAC | **必读** |
| [server-actions.md](./server-actions.md) | next-safe-action：`actionClient` / `authUserActionClient` | **必读** |
| [database.md](./database.md) | Prisma 单例、多 schema、schema 工作流、查询模式 | **必读** |
| [logging.md](./logging.md) | Axiom：`createLogger` / `withAxiomBodyLog` | 参考 |
| [queue.md](./queue.md) | BullMQ 单队列 + job name 路由、独立 worker | 参考 |
| [redis.md](./redis.md) | 两连接、限流积分模型、key 命名 | 参考 |
| [storage.md](./storage.md) | S3 `getS3StorageClient()` | 参考 |
| [type-safety.md](./type-safety.md) | 后端 Zod 校验分层、Prisma 类型推断 | 参考 |
| [quality.md](./quality.md) | 提交前清单 | 参考 |

## 核心规则速查

| 规则 | 出处 |
| --- | --- |
| 业务错误抛 `AiSpecError`，**禁止** handler 手写 `NextResponse.json({ error })` | error-handling.md |
| 入参 Dto / 出参 Vo，均经 Zod 校验 | type-safety.md |
| Route Handler 用 `withPersonal`/`withSession` 包裹（内部已含 `withAxiomBodyLog` + 鉴权 + 错误归一）| route-handlers.md |
| 日志用 `createLogger(module)`，正式日志禁 `console.log` | logging.md |
| 后台任务走 BullMQ（`infrastructure/queue`），不用 `next/after` 跑业务任务 | queue.md |
| Prisma client 从 `@/shared/db` 导入，`generator/` 严禁手改 | database.md |
