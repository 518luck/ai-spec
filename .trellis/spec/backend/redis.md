# Redis 与限流

> 权威源：`src/server/infrastructure/redis/AGENTS.md`、`src/shared/lib/AGENTS.md`。

## 两个连接（按重试性格分）

`src/server/infrastructure/redis/clients.ts` 提供两个 getter，**按重试策略（而非用途）**区分：

| getter | `maxRetriesPerRequest` | 用途 |
| --- | --- | --- |
| `getAppRedis()` | 20（默认，fail-fast）| 限流、KV、BullMQ **生产者**（HTTP 请求内 `queue.add`）；Redis 故障快速报错，不挂请求 |
| `getWorkerRedis()` | null（无限重试）| 仅 BullMQ **Worker**（阻塞取任务）；恢复后自动重连 |

- 两者共用工厂函数，单例缓存：开发环境挂 `globalThis` 抗热更新，生产用模块级变量（**不要**在 getter 内每次 `new Redis()`，会泄漏连接）。
- 新增用途优先复用这两个 getter，不为每用途新建连接。

> 既有路径 `src/shared/lib/infrastructure/redis/reatlimit.ts`（拼写如此）；不要新建平行 `ratelimit.ts`，更名须同步所有调用方。

## 限流（积分模型）

底层 `rate-limiter-flexible`，按**积分**而非次数计：

- 全局默认上限 **10 积分 / 60 秒**。
- 每次调 `ratelimit()` 用 `points` 指定消耗积分；积分耗尽触发限流，阻塞 300 秒。
- `duration` 可覆盖本次时间窗口（秒）。

```ts
import { ratelimit } from "@/server/infrastructure/redis/reatlimit";

// 默认：每次 1 积分，1 分钟窗口
await ratelimit({ key: "action:identifier" });

// 每次 2 积分（上限 10 → 实际最多 5 次）
await ratelimit({ key: "login:attempts:email", points: 2, duration: 60 });
```

被限流时抛 `Error`（消息含剩余等待秒数），调用方无需自行处理限流响应。

### key 命名

格式 `模块:动作:标识符`（冒号分段，段内多词用短横线）。现有 key：

| key 模式 | 说明 |
| --- | --- |
| `login:attempts:{email}` | 登录失败限流 |
| `otp:send:{email}:{ip}` | 发送验证码限流 |
| `signup:attempts:{email}` | 注册验证码尝试限流 |

标识符选能唯一区分调用者的值（邮箱 / IP / 用户 ID）。

## KV

`kv.ts` 提供通用 JSON KV（带 TTL）。

## 新增限流器

优先复用 `ratelimit()`；需要不同上限先尝试调 `points` / `duration`。仅当积分上限/时间窗口/阻塞时长都无法满足时才新建限流器实例，且**必须先向用户说明并经同意**。
