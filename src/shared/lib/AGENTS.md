# shared/lib - AI Agent 局部指南

> 本文件继承上级 `AGENTS.md`，仅记录本目录的额外规则和易错边界。

## 适用范围

- 适用于 `src/shared/lib/**`。
- 上级 `AGENTS.md` 仍然有效，除非本文件明确覆盖。

## 本目录结构

- `ohs/actions/`：基于 `next-safe-action` 的 Server Action、action client 和 action middleware。
- `ohs/api/`：请求上下文、运行环境和 RBAC 等服务端辅助逻辑；不是 Next.js Route Handler 目录。
- `auth/`：NextAuth 配置、session 读取、OTP 和认证相关常量。
- `infrastructure/`：Redis、Axiom（日志）、Resend/React Email、BullMQ 队列等第三方服务适配层。
- `zod/`：跨入口复用的 Zod 校验 schema。
- `utils.ts`：少量跨模块通用工具，避免继续膨胀成业务或基础设施集合。

## 局部代码规则

- 先判断运行环境：任何依赖 `next/headers`、`next/server`、`server-only`、Prisma、Redis、Resend、NextAuth 或进程环境变量的模块，都不得被客户端组件直接导入。
- 新增 Server Action 放在 `ohs/actions/` 下，文件顶部保留 `"use server"`，并复用 `ohs/actions/safe-action.ts` 的 `actionClient` 处理输入校验和服务端错误。
- 新增第三方服务接入放在 `infrastructure/` 的对应服务子目录下，业务代码只能调用本目录暴露的适配函数，不直接散落 SDK 初始化逻辑。
- 共享校验规则放在 `zod/schemas/`；具体 action 可以在共享 schema 基础上 `extend`，不要在多个 action 中复制邮箱、密码、验证码等校验条件。
- `ohs/api/` 只放本目录复用的服务端辅助能力；新增 HTTP 入口仍放在根目录 `app/api/**`。
- `infrastructure/email/**` 使用 `react-email` 组件体系，父级“优先使用 shadcn 组件”规则不适用于邮件模板。
- 新增通用函数时优先按用途新建小文件或归入对应子目录；只有不依赖服务端资源、不会污染客户端 bundle 的函数才继续放入 `utils.ts`。

## 注意事项

- 修改被客户端和服务端共同引用的文件前，先追踪调用方，避免把服务端依赖带入浏览器运行时。
- `infrastructure/redis/reatlimit.ts` 是当前已有导入路径；不要新增平行的 `ratelimit.ts`，如需更名必须同步更新所有调用方。
- 邮件发送在缺少 `RESEND_API_KEY` 时会跳过发送并返回空结果；调整失败策略前必须检查调用方是否依赖这种降级行为。
- 新增或修改 RBAC 资源、权限动作时，同时检查 `ohs/api/rbac/resources.ts` 和 `ohs/api/rbac/permissions.ts`，保持资源 key、权限 action 与角色映射一致。
- 业务后台任务（发邮件、头像同步、异步 workflow 等需可靠执行/重试的）统一走 `infrastructure/queue`（BullMQ，独立 worker 进程）；Next.js `after` 仅用于请求生命周期内的日志 flush，不要用它跑业务后台任务。
