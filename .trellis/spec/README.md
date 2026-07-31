# AI 规范中心（prompt-shelf）

> 本目录是 `.trellis/spec/`，供 Trellis 子代理（`trellis-implement` / `trellis-check`）按任务自动加载的项目规范。权威源是各目录的 `AGENTS.md`，本 spec 是其结构化镜像。

## 技术栈

- **前端**：Next.js 16 App Router + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui
- **数据请求**：TanStack Query + oRPC client（非 SWR）
- **表单**：react-hook-form + zodResolver
- **状态**：useState / props / Context / zustand 按作用范围选
- **后端入口**：oRPC（RPC + OpenAPI 双导出），旧 Route Handler 已废弃
- **后端实现**：`src/server`（orpc / domain / middleware / errors / rbac / actions / infrastructure）
- **ORM**：Prisma（多 schema，单例 `@/shared/db`）
- **认证**：NextAuth v5
- **Server Actions**：next-safe-action（仅 auth/token，资源 CRUD 走 oRPC）
- **校验**：Zod v4（Dto 入 / Vo 出）
- **日志**：Axiom
- **队列**：BullMQ + ioredis（独立 worker 进程）
- **存储**：S3；**邮件**：Resend / react-email
- **工具链**：Biome（lint）/ vitest / tsx
- **项目结构**：单仓 FSD（`src/{app,pages,widgets,features,entities,shared}`），**非 monorepo**

## 结构导航

### [shared/](./shared/index.md) — 通用规则（前后端通用）
- [typescript.md](./shared/typescript.md) · [code-quality.md](./shared/code-quality.md) · [dependencies.md](./shared/dependencies.md)

### [frontend/](./frontend/index.md) — 前端（`src/`）
- [directory-structure.md](./frontend/directory-structure.md) · [components.md](./frontend/components.md) · [orpc-usage.md](./frontend/orpc-usage.md) · [data-fetching.md](./frontend/data-fetching.md) · [state-management.md](./frontend/state-management.md) · [forms.md](./frontend/forms.md) · [toast-and-feedback.md](./frontend/toast-and-feedback.md) · [hooks.md](./frontend/hooks.md) · [css-layout.md](./frontend/css-layout.md) · [type-safety.md](./frontend/type-safety.md) · [quality.md](./frontend/quality.md)

### [backend/](./backend/index.md) — 后端（`app/api` + `src/server`）
- [directory-structure.md](./backend/directory-structure.md) · [orpc-usage.md](./backend/orpc-usage.md) · [route-handlers.md](./backend/route-handlers.md) · [error-handling.md](./backend/error-handling.md) · [authentication.md](./backend/authentication.md) · [server-actions.md](./backend/server-actions.md) · [database.md](./backend/database.md) · [logging.md](./backend/logging.md) · [queue.md](./backend/queue.md) · [redis.md](./backend/redis.md) · [storage.md](./backend/storage.md) · [type-safety.md](./backend/type-safety.md) · [quality.md](./backend/quality.md)

### [guides/](./guides/index.md) — 思维指南
- [pre-implementation-checklist.md](./guides/pre-implementation-checklist.md) · [cross-layer-thinking-guide.md](./guides/cross-layer-thinking-guide.md)

### [big-question/](./big-question/index.md) — 踩坑记录
- [webkit-tap-highlight.md](./big-question/webkit-tap-highlight.md) · [turbopack-webpack-flexbox.md](./big-question/turbopack-webpack-flexbox.md)

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` / `pnpm worker` / `pnpm dev:all` | 前端 / 队列 worker / 同时跑 |
| `pnpm run typecheck` | 类型检查（不直接跑 tsc）|
| `pnpm run lint` | Biome check --write |
| `pnpm run test` | vitest run |
| `pnpm run prisma:generate` / `prisma:migrate` | 生成 Client / 迁移 |

## 权威源对照

本 spec 内容来自项目现成的 `AGENTS.md`（根、`app/`、`app/api/`、`src/`、`prisma/`、`src/shared/lib/`、`src/shared/lib/zod/`、`src/shared/hooks/`、`src/server/infrastructure/{axiom,queue,redis,storage}/`）。冲突时以 `AGENTS.md` 为准。
