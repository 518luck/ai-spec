# 队列（BullMQ）

> 权威源：`src/server/infrastructure/queue/AGENTS.md`。业务后台任务（发邮件、头像同步、异步 workflow 等需可靠执行/重试的）统一走 BullMQ。

## 核心原则：单队列 + 命名任务分发

**禁止**为每种任务类型创建独立队列（不要一个 job type 一个 queue）。用**少量队列**承载多种 job，通过 `job.name` 区分，在 worker 内按 name 路由到处理逻辑。

### 当前已批准的独立队列

| 队列 | 原因 |
| --- | --- |
| `background-jobs` | 通用后台任务（邮件、头像、discover-resume）|
| `discover` | GitHub 配额串行 + 整队 pause/resume |
| `translation` | 机翻有独立 concurrency / 限流，且不能拖慢邮件与 GitHub 同步 |

没有强需求（均匀/隔离处理、优先级隔离、独立并发/限流）不要新增队列。

## 实现位置

| 角色 | 位置 |
| --- | --- |
| Queue（生产者，`new Queue`）| `src/server/infrastructure/queue/queues.ts` |
| Worker（消费者，`new Worker`）| **仓库根 `workers/queue/`**（`background-worker.ts` 等，独立进程 `pnpm worker`）|
| 队列配置 / job 名常量 | `src/server/infrastructure/queue/constants.ts`（`*_QUEUE_CONFIG`、`JOB_NAMES`）|
| 按 name 路由的 processor | `src/server/infrastructure/queue/operations/<域>/router.ts` |
| 统一对外出口 | `src/server/infrastructure/queue/index.ts`（re-export 各 `enqueue*`）|

```ts
// 生产者：Queue 共用 getAppRedis()（fail-fast）
// src/server/infrastructure/queue/queues.ts
const backgroundJobsQueue = new Queue("background-jobs", { connection: getAppRedis(), defaultJobOptions });

// 消费者：Worker 用 getWorkerRedis()（无限重试）
// workers/queue/background-worker.ts
new Worker("background-jobs", processBackgroundJob, { connection: getWorkerRedis() });
```

## 命名约定

- job 的 `name` 用稳定字符串常量（`JOB_NAMES`，`as const` 或枚举），生产/消费共用，避免魔法字符串。
- 现有 `JOB_NAMES`：`avatar-sync`/`avatar-cleanup`/`email-change`/`email-changed-notice`/`discover-scan`/`discover-sync-repo`/`discover-sweep`/`discover-resume`/`translate-batch`。

## 多 job 类型与类型安全

queue 泛型默认面向单一 job，混合多种 job 时：

- 定义联合类型或按 name 区分的判别联合（discriminated union）作为 payload。
- processor 内通过 name 收窄类型，**避免 `any`**。
- job 类型多时用 `{ [name]: processor }` 注册表代替冗长 switch。

## Next.after 的边界

Next.js `after` **仅用于请求生命周期内的日志 flush**，**不要**用它跑业务后台任务——业务后台任务走 BullMQ（独立 worker 进程，可靠执行 + 重试）。

## 反模式

- ❌ `new Queue("email")`、`new Queue("image")`... 每个业务各起一个 queue。
- ❌ 为绕开类型问题把多种 job 拆成多个 queue。
- ❌ 用 `any` 牺牲多 job 类型下的类型安全。
- ❌ 用 `next/after` 跑发邮件、头像同步等业务任务。
