# 架构全景

> 本文档记录 AI Spec 项目的架构现状、目标形态与演进路线。
> 任何涉及目录结构、跨服务依赖、技术栈选型的改动，先读本文件和相关 ADR。

## 如何使用本目录的文档

三份文档各有职责，按需阅读：

| 文档 | 性质 | 何时读 |
| --- | --- | --- |
| `overview.md`（本文件） | 长期参考 | 接手项目、做架构相关决策前 |
| `decisions.md` | 长期参考 | 提出新技术选型、重构、改方向前，确认是否违背已有 ADR |
| `migration-phase-1.md` | 一次性计划 | 真正动手做 monorepo 拆分时照着执行 |

阅读顺序建议：先读本文件建立全景认知 → 遇到具体疑问查 `decisions.md` 对应 ADR → 准备执行迁移时打开 `migration-phase-1.md`。

## 项目定位

AI Spec 是一个 **支持富文本协同编辑的 AI 规格协作工具**。核心难点是多人实时协同编辑同一份文档，需要解决冲突合并、光标同步、撤销栈等问题。

## 当前技术栈

| 层 | 技术 | 版本 |
| --- | --- | --- |
| 框架 | Next.js（App Router） | 16.2.4 |
| 运行时 | React + React DOM | 19.2.4 |
| 语言 | TypeScript | ^5 |
| 数据库 ORM | Prisma + `@prisma/adapter-pg` | ^7.8 / ^7.8 |
| 数据库 | PostgreSQL | — |
| 任务队列 | BullMQ + ioredis（Redis） | ^5.78 / ^5.10 |
| 认证 | next-auth v5（`@auth/prisma-adapter`） | 5.0.0-beta.31 |
| 限流 | rate-limiter-flexible + Redis | ^11.1.0 |
| 对象存储 | `@aws-sdk/client-s3`（S3/R2/MinIO 兼容） | ^3.1068 |
| 邮件 | Resend + react-email | ^6.12 / 6.1.4 |
| 日志 | Axiom（`@axiomhq/nextjs` 等） | — |
| 表单 | react-hook-form + zod v4 + `@hookform/resolvers` | — |
| Server Actions | next-safe-action | ^8.5.2 |
| UI 组件 | shadcn（base-vega style）+ `@base-ui/react` + lucide-react | — |
| 样式 | Tailwind CSS v4 + `@tailwindcss/postcss` + tw-animate-css | — |
| 包管理 | pnpm | — |

## 当前架构状态

**单体 Next.js 应用 + 一个独立 worker 进程。**

```
ai-spec/
├── app/                  # Next.js App Router 路由层
│   └── api/              # 后端 API 入口（auth、debug 等）
├── src/                  # 前端业务代码 + 共享后端基础设施（FSD 架构）
│   ├── app/              # 应用入口、providers、全局样式
│   ├── pages/            # 完整页面
│   ├── widgets/          # 大型独立功能块
│   ├── features/         # 业务动作
│   ├── entities/         # 业务实体
│   └── shared/           # 通用能力（含后端基础设施）
│       └── lib/infrastructure/  # queue / redis / storage / email / axiom
├── prisma/               # schema + migrations
├── worker.ts             # BullMQ worker 独立进程（头像同步）
└── package.json
```

启动方式（当前）：分别运行 `pnpm dev`（Next.js）和 `pnpm worker`（BullMQ），需要开两个终端。

`worker.ts:3` 已有 TODO 注释：未来应独立成专门处理队列任务的服务。

## 目标架构（monorepo 终态）

```
ai-spec/
├── apps/
│   ├── web/              # Next.js：前端 + HTTP API + 页面渲染
│   ├── worker/           # BullMQ 任务处理服务（独立部署）
│   └── realtime/         # Hocuspocus + Yjs 协同编辑服务（独立部署，长连接）
├── packages/
│   ├── db/               # Prisma schema + 生成的 client（多服务共享）
│   ├── shared/           # queue / redis / storage / email 等纯基础设施
│   └── eslint-config/    # 共享 ESLint 配置（可选）
├── turbo.json
├── pnpm-workspace.yaml
└── package.json          # workspace 根
```

### 每个 app / package 的职责边界

- **apps/web**：承载所有 Next.js 能力。包括页面渲染、HTTP API（`app/api/**`）、Server Actions、next-auth 认证。**和 Next 强耦合的代码永远留在 web**，不外抽（见下方「关键认知点」）。
- **apps/worker**：独立进程，消费 BullMQ 队列。独立部署是为了：1) 重任务不影响 web 响应；2) 可独立扩缩容。
- **apps/realtime**：独立进程，承载 WebSocket 长连接，运行 Yjs/Hocuspocus 协同引擎。**这是必须独立的服务**——Vercel 不支持长连接，且协同引擎需独占事件循环。
- **packages/db**：Prisma schema 是单一事实来源，生成的 client 供 web/worker/realtime 共享，避免类型与数据库逻辑漂移。
- **packages/shared**：**只放纯基础设施**（queue/redis/storage/email）。绝不放任何依赖 `next/*`、`next-auth`、`next-safe-action`、`next/headers` 的代码。

## 演进路线图

> 每个阶段都有明确的「触发条件」，避免提前做过度工程。

### 阶段 0：止血（已完成调研，尚未实施）

**目标**：解决「开发要开两个终端」的体验问题。

**做法**：引入 `concurrently`，让 `pnpm dev` 同时拉起 next + worker。

**触发条件**：现在就该做。

### 阶段 1：最小骨架（推荐起步，详见 `migration-phase-1.md`）

**目标**：搭起 monorepo 骨架，让 `turbo dev` 一条命令管所有进程；但**不抽任何 packages**。

**做法**：
- 整个 Next.js 项目整体平移进 `apps/web/`
- worker.ts 暂留 web 内，用 `concurrently` 在 web 包内并行运行
- `packages/` 留空占位
- 引入 `pnpm-workspace.yaml` + `turbo.json`

**为什么这一步不抽 packages**：见 ADR-004。worker 当前只有头像同步一个任务，抽离属过度工程；且整体平移因路径相对性，几乎零风险。

**触发条件**：基础界面做好后即可执行。

### 阶段 2：共享层下沉

**目标**：把 worker 用到的纯基础设施抽到 `packages/`，为 worker/realtime 独立成包做准备。

**做法**：
- 抽 `src/shared/lib/infrastructure/{queue,redis}` + `src/shared/db` 到 `packages/shared` + `packages/db`
- web 中相关 import 从 `@/shared/...` 改为 `@repo/shared` / `@repo/db`
- worker 仍可暂留 web 内，或同步拆为 `apps/worker`

**触发条件**（满足任一）：
- worker 任务数 > 5 个，或 worker 影响 next dev 启动速度
- 即将开始做 realtime 服务

### 阶段 3：realtime 协同服务

**目标**：实现富文本协同编辑能力。

**做法**：
- 新建 `apps/realtime`，运行 Hocuspocus（Yjs 服务端）
- 前端集成 Tiptap 编辑器 + Yjs provider
- 本地跑通多人协同

**技术选型理由**：见 ADR-005。

**触发条件**：开始做协同编辑功能。

### 阶段 4：部署上线

**目标**：服务各自独立部署。

**做法**：见下方「部署架构」。

**触发条件**：功能就绪准备上线。

## 部署架构（目标）

```
Vercel   ←  apps/web       (前端 + HTTP API，无长连接)
Railway  ←  apps/worker    (BullMQ 任务处理)
Railway  ←  apps/realtime  (Hocuspocus WebSocket，长连接)
Postgres ←  Railway / Supabase (三服务共享一个库)
Redis    ←  Railway (BullMQ + Yjs 持久化)
```

- **Vercel**：只放 web。不支持长连接，所以 realtime 必须独立。
- **Railway**：对一人开发最友好，支持 WebSocket、git push 自动部署、有免费额度、UI 直观。Fly.io 性能更好但配置稍复杂。
- **不推荐自托管 VPS**：一人运维成本不值。

## 关键认知点（避坑指南）

接手者必读。这些是踩过坑或反复讨论后澄清的认知，避免重新走弯路。

### 1. `src/shared/` 分两类代码，只有「纯基础设施」可抽

`src/shared/` 目录里混了两类性质完全不同的代码，**抽离时必须区分**：

**类型一：和 Next 死耦合（永不外抽，永远留在 apps/web）**

| 路径 | 绑定的 Next 能力 |
| --- | --- |
| `src/shared/lib/auth/` | next-auth、`@auth/prisma-adapter` |
| `src/shared/lib/actions/` | next-safe-action、`next/server` 的 `after()` |
| `src/shared/lib/api/utils/get-ip.ts` | `next/headers` |
| `src/shared/lib/infrastructure/axiom/server.ts` | `@axiomhq/nextjs` |

这些代码离开 Next.js 无法运行，强行抽到独立包会引入对 `next/*` 的依赖，违背包的独立性。

**类型二：纯基础设施（可抽到 packages/shared）**

| 路径 | 实际依赖（与 Next 无关） |
| --- | --- |
| `src/shared/lib/infrastructure/queue/` | bullmq |
| `src/shared/lib/infrastructure/redis/` | ioredis + rate-limiter-flexible |
| `src/shared/lib/infrastructure/storage/` | `@aws-sdk/client-s3` |
| `src/shared/lib/infrastructure/email/` | resend |
| `src/shared/db/` | `@prisma/client` + `@prisma/adapter-pg` |
| `src/shared/lib/zod/` | zod |

这些代码只依赖各自的库，可原封不动搬到任何 Node 项目里运行。**抽离的目标范围就是这一类。**

### 2. 「worker 独立成包」⟺「必须抽 shared」

这是个绑死的等价关系，不存在中间态：

- worker 不独立（留 web 内）→ 不用抽任何东西，继续用 `@/shared/...` 别名
- worker 独立（变成 `apps/worker`）→ 必须抽 queue/redis/db 到 `packages/`，因为 monorepo 里跨包不能用相对路径（`../../web/src/...`）引用

原因：monorepo 里每个 `apps/*` 是独立 npm 包，跨包只能通过包名（`@repo/xxx`）引用，不能钻进别的包的内部目录。详见 ADR-004。

### 3. 富文本协同必须用 CRDT/OT 引擎，不能用 Socket.IO

Socket.IO / `ws` 只是消息传输层，**不懂「文档状态合并」**。富文本协同要解决的核心是冲突合并（两人同时改同一段），必须用：

- **CRDT（推荐）**：Yjs——事实标准，生态最成熟
- **OT**：Operational Transformation——实现复杂，新项目不推荐

技术栈选型见 ADR-005。

### 4. Prisma 输出路径是相对 schema.prisma 的

`prisma/schema/schema.prisma` 里写死了：

```prisma
generator client {
  output = "../../src/shared/db/generator"
}
```

这个 `../../` 是相对 `schema.prisma` 自身位置的两层上层目录。整体平移项目时，由于 `schema.prisma` 和 `src/` 一起搬、相对位置不变，**这条路径不用改**。但如果把 prisma 抽到 `packages/db`，就必须改这条 output。

`src/shared/db/generator/` 下所有文件由 `prisma generate` 自动生成，**禁止手动修改**（见根 AGENTS.md）。

### 5. WebSocket 不能部署到 Vercel

这是平台约束，不是 Next.js 的缺陷，**更不是「必须换 Go」的理由**。Vercel 设计为 serverless 函数，不支持长连接。解法是把 WebSocket 服务独立部署到 Railway/Fly.io 等支持长连接的平台。详见 ADR-001。

### 6. 富文本协同是前端最复杂的领域之一

冲突解决、光标同步、撤销栈整合——复杂度极高。如果同时还要重写后端语言（如 Go），会双线作战、拖垮项目。这是 ADR-001 坚持「保留 TypeScript」的核心论据。
