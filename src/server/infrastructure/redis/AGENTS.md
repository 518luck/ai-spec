# Redis 连接与限流器

本目录管理所有 Redis 连接和基于 Redis 的频率限制能力。

## 目录结构

```
redis/
├── clients.ts          # 两个 Redis 连接（应用 fail-fast / Worker 无限重试）
├── reatlimit.ts        # 限流逻辑（rate-limiter-flexible）
├── kv.ts               # 通用 JSON KV（带 TTL）
└── AGENTS.md
```

### 为什么是两个连接

`clients.ts` 按重试策略（而非用途）提供两个 getter，区分「请求链路」与「后台消费」：

| getter | maxRetriesPerRequest | 用途 |
| --- | --- | --- |
| `getAppRedis()` | 20（默认，fail-fast） | 限流、KV、BullMQ **生产者**（HTTP 请求内 `queue.add`）；Redis 故障时快速报错，不挂住请求 |
| `getWorkerRedis()` | null（无限重试） | 仅 BullMQ **Worker**（阻塞取任务）；Redis 恢复后自动重连 |

> ⚠️ 划分依据是**重试性格**：HTTP 链路要快速失败，Worker 要无限重试。`getAppRedis()` 一条连接被限流 / KV / 队列生产者共用，符合 BullMQ「多个 Queue 共用一条连接」的官方写法；Worker 内部会自行 `.duplicate()` 出阻塞连接。

两者共用工厂函数 `createRedisClient(maxRetriesPerRequest)`。单例缓存采用 Prisma 式：开发环境挂到 `globalThis` 以扛 Next.js 热更新，生产环境用模块级变量保证全进程单例（**不要**在 getter 内每次 `new Redis()`，会泄漏连接）。

## 限流器

底层使用 `rate-limiter-flexible` 的积分消耗模型。

### 积分模型

限流器不按"次数"计，而是按"积分"计：

- 全局默认上限 10 积分 / 60 秒时间窗口。
- 每次调用 `ratelimit()` 时通过 `points` 参数指定本次消耗多少积分。
- 积分耗尽后触发限流，阻塞 300 秒。
- 可通过 `duration` 参数覆盖本次调用的自定义时间窗口（秒）。

示例：上限 10 积分，每次消耗 2 积分 → 实际 1 分钟内最多 5 次请求。

### key 命名规范

key 格式：`模块:动作:标识符`，模块和动作之间使用冒号分隔，单个分段内的多词名称使用短横线连接。

已有 key：

| key 模式                  | 说明               |
| ------------------------- | ------------------ |
| `login:attempts:{email}`  | 登录失败限流       |
| `otp:send:{email}:{ip}`   | 发送验证码限流     |
| `signup:attempts:{email}` | 注册验证码尝试限流 |

新增 key 时沿用 `模块:动作:标识符` 格式，标识符选择能唯一区分调用者的值（邮箱、IP、用户 ID 等）。

### 使用方式

```ts
import { ratelimit } from "@/server/infrastructure/redis/reatlimit";

// 每次消耗 1 积分，1 分钟窗口（默认值）
await ratelimit({ key: "action:identifier" });

// 每次消耗 2 积分（上限 10 → 实际最多 5 次）
await ratelimit({ key: "login:attempts:email", points: 2, duration: 60 });
```

被限流时会抛出 `Error`，消息包含剩余等待秒数，调用方不需要自行处理限流响应。

## 注意事项

- 优先复用 `ratelimiter` 和 `ratelimit()`；需要不同上限时先尝试通过调整 `points`（每次消耗量）或 `duration` 实现。
- 当现有限流器的积分上限、时间窗口或阻塞时长无法满足需求时，可以新建限流器实例，但必须先向用户说明原因并经用户同意后才能创建。
- `clients.ts` 提供两个 getter：`getAppRedis()`（fail-fast，限流/KV/队列生产者共用）与 `getWorkerRedis()`（null，仅 Worker），按重试性格区分、不要混用。新增用途时优先复用这两个，不要为每个用途新建连接。
