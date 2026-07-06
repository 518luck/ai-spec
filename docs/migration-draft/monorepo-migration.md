# AI Spec Monorepo 迁移计划（草稿）

> **状态：草稿** —— 逐项问答细化中，成熟后定为正式计划，再开始执行。
>
> 本文件取代被删除的 `docs/architecture/{overview,decisions,migration-phase-1}.md`；其中的 ADR 选型理由已并入本文「关键决策」一节，不丢失。

---

## 一、背景与目标

### 现状痛点

单体 Next.js 仓库 + 一个根目录的 `worker.ts`。worker 和 Next 应用**共享同一份代码**，导致：

- worker 进程被迫加 `--conditions react-server`（否则 `redis/clients.ts`、`storage/*` 里的 `server-only` 在 worker 启动时抛错）。
- 这个条件又把 `react-dom/server` 解析成抛错桩 → worker 处理 `email-change` 任务时（react-email 渲染邮件）崩溃：「Zero-length key」之后的下一个坑正是 `react-dom/server is not supported in React Server Components`。

根因：**worker 与 Next 应用深度耦合**。

### 目标

转成 monorepo：worker 独立成 `apps/worker`（自己的依赖、自己的运行条件），去掉 `--conditions react-server` → email 崩溃**自愈**；共享的纯基建（db / redis / storage / email）变成 `packages/*`，web 和 worker 都能 import。

---

## 二、最小心智模型（零基础先读这个）

- **现状**：一个仓库、一个 `package.json`，`worker.ts` 在根目录，和 Next 应用共享全部代码。
- **monorepo**：还是**一个仓库**，但里面分成多个「包」（`apps/*` 和 `packages/*`），每个有自己的 `package.json`，彼此**用包名**（`@repo/xxx`）互相 import。
- **pnpm workspace**：把 `apps/*`、`packages/*` 认成「内部包」并自动建立链接的工具。靠根目录的 `pnpm-workspace.yaml` 声明。
- **turborepo**：在 workspace 之上的任务跑龙套——一条 `turbo dev` 并行启动所有 app 的 dev，带缓存和依赖拓扑。
- **`@repo/` 前缀**：内部包的命名约定（社区惯例），和 npm 公共包区分。

> 一句话：**monorepo 不是「多开几个项目」，而是「一个仓库里划出几个互相 import 的包，各自有自己的依赖和运行方式」。**

---

## 三、目标架构

```
ai-spec/
├── apps/
│   ├── web/        ← 整个 Next.js（Next 死耦合代码全留这）
│   └── worker/     ← worker.ts + queue/operations/（router + 3 个 processor）
├── packages/
│   ├── db/         ← prisma/ + 手写 db index + 生成的 client
│   ├── shared/     ← queue（生产者）+ redis + storage + nanoid + app.config   【无 React】
│   └── email/      ← email/（provider + resend + mailpit + templates）        【唯一带 React】
├── pnpm-workspace.yaml / turbo.json / tsconfig.base.json / package.json
```

### 依赖图（无环）

```
@repo/db     （叶子）
@repo/shared （叶子，无 React）
@repo/email  → @repo/shared （取 app.config）
apps/web     → {db, shared, email}
apps/worker  → {db, shared, email}
```

---

## 四、包边界（什么留 web、什么外抽）

| 留 `apps/web`（Next 死耦合，永不外抽）                                                                                            | 抽到 packages                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `auth/`、`actions/`、`axiom/server.ts`、`api/utils/get-ip.ts`、`utils.ts`、`zod/`、`entities/`、`features/`、`pages/`、`widgets/` | `@repo/db`：prisma + db index                                                                               |
|                                                                                                                                   | `@repo/shared`：queue 生产者（constants/types/queues/index-enqueue）+ redis + storage + nanoid + app.config |
|                                                                                                                                   | `@repo/email`：email 整套（provider + resend + mailpit + templates + components）                           |
|                                                                                                                                   | `apps/worker`：worker.ts + queue/operations/（router + 3 ops）                                              |

> **email 单列的理由**：它是唯一拉 React 的共享件；隔离后 `@repo/shared` 保持纯基建、无 React，依赖故事更干净。

---

## 五、关键决策（替代被删的 ADR，迁移完成后落回 `docs/architecture/`）

| 决策                                               | 理由                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **pnpm workspace + turborepo、`@repo/` 前缀**      | workspace 依赖隔离、安装快；turbo 任务编排 + 缓存 + 依赖拓扑；`@repo/` 社区惯例      |
| **包发 TS 源码，不预编译**                         | web 用 `transpilePackages`、worker 用 `tsx` 转译；零构建步骤，一人项目最简           |
| **email 单列 `@repo/email`**                       | 隔离 React 依赖，`@repo/shared` 保持纯净                                             |
| **从 `@repo/shared` 移除 6 处 `server-only`**      | worker 去掉 `--conditions react-server` 的前提；改用 web FSD 约定 + ESLint 兜底      |
| **worker 独立 + 去掉 `--conditions react-server`** | 治本：worker 自身正当依赖 react-email → `react-dom/server` 解析正常 → email 崩溃自愈 |
| **email-change 渲染逻辑不动**                      | 解耦后 worker 能自己渲染，无需「生产者渲染 HTML」那套（比战术修法更干净）            |
| **保留 TypeScript 不换 Go**                        | 仍成立：类型共享是 Next 全栈红利；一人 + Go 基础语法重写不可行                       |

---

## 六、执行路线（草稿项，逐项问答细化）

```
【项 0】 删除旧架构文档（3 个 .md）
─── 阶段 A：骨架 ───
【项 A1】 搭 workspace + turbo 骨架，把 Next 项目平移进 apps/web
【项 A2】 验证 turbo dev（一条命令拉起 next + worker）
─── 阶段 B：抽包 + worker 独立 ───
【项 B1】 抽 @repo/db（Prisma）
【项 B2】 抽 @repo/shared（queue 生产者 + redis + storage + nanoid + app.config，移除 6 处 server-only）
【项 B3】 抽 @repo/email（email 整套，唯一带 React 的包）
【项 B4】 拆 apps/worker（去掉 --conditions react-server → email 崩溃自愈）
【项 B5】 web 的 import 批量改成 @repo/*（~50–70 文件）
【项 B6】 配 transpilePackages / tsconfig / turbo 任务 + 最终验证
```

### 【项 0】删旧文档

删除 `docs/architecture/{overview,decisions,migration-phase-1}.md`。ADR 选型理由已并入本文件第五节。

### 【项 A1】搭骨架 + Next 平移进 apps/web

**做什么**：

1. 根目录建 `pnpm-workspace.yaml`，声明 `apps/*`、`packages/*` 为内部包（合并现有 `allowBuilds`）。
2. 用 `git mv` 把整个 Next 项目（`app/`、`src/`、`prisma/`、`worker.ts`、`next.config.ts`、`tsconfig.json`、`postcss.config.mjs`、`prisma.config.ts`、`components.json`、`eslint.config.mjs`、`.env`）平移进 `apps/web/`。
3. 拆 `package.json`：根只留 turbo + prettier + `turbo xxx` 脚本；`apps/web/package.json` 承载全部原依赖。
4. 建 `turbo.json`（dev/build/lint/typecheck）。
5. 更新根 `AGENTS.md` 结构图路径前缀。

**为什么几乎零风险**：项目里所有路径都是「相对自身」（`@/*`→`./src/*`、Prisma `output=../../...`、`worker.ts` 的 `./src/...`），整体一起搬进 `apps/web/`，相对关系完全不变 → 几乎不改任何 import。

**注意**：worker 暂留 `apps/web/`、仍带 `--conditions react-server`，email 崩溃要等【项 B4】才解决。

### 【项 A2】验证 turbo dev

`pnpm install` → `pnpm typecheck` 全绿 → `pnpm dev` 同时出 next + worker 日志 → 登录/头像正常 → 提交 checkpoint。

### 【项 B1】抽 @repo/db

搬 `prisma/` + `src/shared/db`；改 `schema.prisma` 的 `output` 为相对 `packages/db` 的新路径；`db/index.ts` 的 generator import 同步。

### 【项 B2】抽 @repo/shared

搬 queue 生产者部分（constants/types/queues/index-enqueue）+ redis + storage + nanoid + app.config；**移除 6 处 `server-only`**（`redis/clients`、`redis/kv`、`storage/index`、`storage/client`、`storage/constants`、`storage/utils`）；修内部互相 import。

### 【项 B3】抽 @repo/email

搬 email 整套（provider + resend + mailpit + templates + components）；`@repo/email` 依赖 `@repo/shared`（取 app.config）。

### 【项 B4】拆 apps/worker

搬 `worker.ts` + `queue/operations/`（router + 3 ops）；建自己的 `package.json`（真实依赖 react/react-dom/react-email/bullmq/ioredis + `@repo/db` + `@repo/shared` + `@repo/email`）和 `tsconfig.json`；启动命令 `tsx worker.ts`（**去掉 `--conditions react-server`**）。

### 【项 B5】web import 批量改

web 里：`@/shared/db`→`@repo/db`；`@/shared/lib/infrastructure/{queue,redis,storage}`→`@repo/shared`；`@/shared/lib/infrastructure/email`→`@repo/email`；`@/shared/configs/app.config`→`@repo/shared`（~50–70 文件，脚本辅助）。

### 【项 B6】配置 + 最终验证

`apps/web/next.config.ts` 加 `transpilePackages: ["@repo/db","@repo/shared","@repo/email"]`；各包 `tsconfig.json` + 根 `tsconfig.base.json`；`turbo.json` 加 worker 的 dev/build/typecheck。
验证：`turbo dev` → 登录 → 头像 → **改邮箱触发 email-change，worker 正常渲染发信不崩**。

---

## 七、风险与回滚

- **零测试 / 零 CI**：每阶段只靠 `typecheck` + 手动冒烟。所以分两阶段、各自 checkpoint + 提交，出问题回滚到上一个 checkpoint。
- 全程 `git mv` 保历史；全程在 `chore/monorepo-migration` 分支；回滚 = 丢分支。
- 最大风险：阶段 B 的 import 批量替换、Prisma output 重配、`transpilePackages` 漏配——只能 typecheck + 手动跑流程抓。

---

## 八、工作量

阶段 A ≈ 半天；阶段 B ≈ 1.5–2 天；合计 2–3 天。

---

## 九、问答记录（逐项细化时追加）

（每项问答、调整、确认结果在此追加，作为草稿→正式计划的演化痕迹。）
