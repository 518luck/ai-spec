# Redis 限流器

本目录提供基于 Redis 的频率限制能力，底层使用 `rate-limiter-flexible` 的积分消耗模型。

## 积分模型

限流器不按"次数"计，而是按"积分"计：

- 全局默认上限 10 积分 / 60 秒时间窗口。
- 每次调用 `ratelimit()` 时通过 `points` 参数指定本次消耗多少积分。
- 积分耗尽后触发限流，阻塞 300 秒。
- 可通过 `duration` 参数覆盖本次调用的自定义时间窗口（秒）。

示例：上限 10 积分，每次消耗 2 积分 → 实际 1 分钟内最多 5 次请求。

## key 命名规范

key 格式：`模块:动作:标识符`，模块和动作之间使用冒号分隔，单个分段内的多词名称使用短横线连接。

已有 key：

| key 模式                  | 说明               |
| ------------------------- | ------------------ |
| `login:attempts:{email}`  | 登录失败限流       |
| `otp:send:{email}:{ip}`   | 发送验证码限流     |
| `signup:attempts:{email}` | 注册验证码尝试限流 |

新增 key 时沿用 `模块:动作:标识符` 格式，标识符选择能唯一区分调用者的值（邮箱、IP、用户 ID 等）。

## 使用方式

```ts
import { ratelimit } from "@/shared/lib/infrastructure/redis/reatlimit";

// 每次消耗 1 积分，1 分钟窗口（默认值）
await ratelimit({ key: "action:identifier" });

// 每次消耗 2 积分（上限 10 → 实际最多 5 次）
await ratelimit({ key: "login:attempts:email", points: 2, duration: 60 });
```

被限流时会抛出 `Error`，消息包含剩余等待秒数，调用方不需要自行处理限流响应。

## 注意事项

- 优先复用 `ratelimiter` 和 `ratelimit()`；需要不同上限时先尝试通过调整 `points`（每次消耗量）或 `duration` 实现。
- 当现有限流器的积分上限、时间窗口或阻塞时长无法满足需求时，可以新建限流器实例，但必须先向用户说明原因并经用户同意后才能创建。
- `client.ts` 导出的 `redis` 实例同时作为限流器的存储客户端；如需新增非限流的 Redis 用途，复用该实例，不要另建连接。
