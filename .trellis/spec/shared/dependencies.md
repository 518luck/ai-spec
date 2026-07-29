# 技术栈与依赖

> 本项目是**单仓** Next.js 全栈应用（工程名 `prompt-shelf`），不是 monorepo，无 `packages/*` 工作区。版本来自 `package.json`，更新依赖后同步本表。

## 运行时

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| next | 16.2.10 | App Router |
| react / react-dom | 19.2.4 | |
| typescript | ^5 | strict |

## 后端

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| @prisma/client | ^7.8.0 | ORM（driver adapter，生成到 `src/shared/db/generator/`）|
| @prisma/adapter-pg | ^7.8.0 | pg driver adapter |
| pg | ^8.20.0 | PostgreSQL 客户端 |
| next-auth | 5.0.0-beta.31 | NextAuth v5 |
| next-safe-action | ^8.5.2 | Server Actions |
| zod | ^4.4.3 | 校验，统一 `import * as z from "zod/v4"` |
| ioredis | ^5.10.1 | Redis 客户端 |
| bullmq | ^5.78.0 | 队列（独立 worker 进程 `pnpm worker`）|
| rate-limiter-flexible | ^11.1.0 | 限流（积分模型）|
| @axiomhq/logging / @axiomhq/nextjs / @axiomhq/js | — | 日志 |
| @aws-sdk/client-s3 | ^3.1068.0 | 对象存储 |
| resend / react-email / nodemailer | — | 邮件 |
| bottleneck | ^2.19.5 | 并发控制 |
| bcryptjs | ^3.0.3 | 密码哈希 |

## 前端

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| swr | ^2.4.2 | 数据请求（非 React Query）|
| react-use | ^17.6.1 | hooks 工具库（经 `@/shared/hooks` barrel）|
| zustand | ^5.0.14 | 全局/持久化状态 |
| react-hook-form | ^7.76.0 | 表单 |
| @hookform/resolvers | ^5.2.2 | zodResolver |
| shadcn | ^4.12.0 | 组件（用 `npx shadcn@latest add`，**不要** `pnpm dlx`）|
| @tabler/icons-react | ^3.44.0 | 图标库（统一在 `icons.tsx` 注册）|
| sonner | ^2.0.7 | toast（仅 `@/features/toast` 内部用）|
| motion | ^12.38.0 | 动画 |
| tailwindcss / @tailwindcss/postcss | ^4 | v4 配置格式 |
| tailwind-merge / class-variance-authority / clsx | — | className 工具 |
| date-fns | ^4.4.0 | 日期 |
| nanoid | ^5.1.11 | ID |

## 工具链

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| @biomejs/biome | 2.5.2 | Lint + 格式化 |
| vitest | ^4.1.9 | 测试 |
| tsx | ^4.22.4 | TS 执行器（worker、脚本）|
| fumadocs-mdx / -ui / -core | — | 文档站 |

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 前端开发 |
| `pnpm worker` | 队列 worker |
| `pnpm dev:all` | 同时跑 next + worker |
| `pnpm run typecheck` | 类型检查（不直接跑 tsc）|
| `pnpm run lint` | Biome check --write |
| `pnpm run test` | vitest run |
| `pnpm run prisma:generate` | 生成 Prisma Client |
| `pnpm run prisma:migrate` | 创建并应用迁移 |

## 重要约束

- **单仓 FSD**：前端业务在 `src/{app,pages,widgets,features,entities,shared}`，后端入口在 `app/api`，后端实现在 `src/server`。无 `@your-app/*` 包引用。
- **Prisma**：ORM 是 Prisma，不是 Drizzle。schema 在 `prisma/schema/`，多 schema（`@@schema("prompt")` 等）。`src/shared/db/generator/` 自动生成，**严禁手改**。
- **shadcn 安装**：必须 `npx shadcn@latest add <组件>`（`pnpm dlx` 会复用本地带 bug 旧版导致 zod 冲突崩溃）。
