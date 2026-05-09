# rate-limiter-flexible 使用指导手册

> **rate-limiter-flexible** 是 Node.js、Deno 和浏览器中可用的原子/非原子计数与限流工具库。
> 它通过 key 对行为进行计数和限流，防护 DoS 和暴力破解攻击，支持 Redis、MongoDB、MySQL、PostgreSQL、Memcached、DynamoDB、Prisma、Drizzle、SQLite、Etcd、Valkey、内存、Cluster、PM2 等多种存储后端。
> 零生产依赖，采用增强的固定窗口算法。

---

## 目录

1. [第一步：最小实现](#第一步最小实现)
2. [第二步：常用 API 详解](#第二步常用-api-详解)
3. [第三步：常用使用技巧](#第三步常用使用技巧)
4. [第四步：注意事项](#第四步注意事项)

---

## 第一步：最小实现

### 1. 安装

```bash
npm i rate-limiter-flexible
```

### 2. 最小可用示例（内存限流器）

```js
// ESM 导入方式（推荐）
import { RateLimiterMemory } from "rate-limiter-flexible";

// 创建一个内存限流器：每 60 秒最多允许 10 次请求
const rateLimiter = new RateLimiterMemory({
  points: 10, // 【积分上限】在 duration 时间内最多可消耗的积分数
  duration: 60, // 【时间窗口】单位秒；60 秒后积分重置。0 表示永不过期
});

async function handleRequest(userKey) {
  try {
    // 【consume】消耗积分：每次默认消耗 1 点
    const res = await rateLimiter.consume(userKey);
    console.log("请求通过", res.remainingPoints, "剩余积分");
    return true;
  } catch (rejRes) {
    if (rejRes instanceof Error) {
      // 【存储错误】比如 Redis 挂了（内存模式不会走到这里）
      console.error("存储异常:", rejRes.message);
      throw rejRes;
    }
    // 【限流触发】rejRes 是 RateLimiterRes 对象
    console.log("请求被限流", rejRes.msBeforeNext, "毫秒后重试");
    return false;
  }
}
```

### 3. Express 中间件最小示例

```js
import express from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

const app = express();

// 【内存限流器】单进程最快，适合单个实例部署
const limiter = new RateLimiterMemory({
  points: 10, // 每秒最多 10 次请求
  duration: 1, // 时间窗口 1 秒
});

// 【中间件】对每一路由进行限流
const rateLimiterMiddleware = async (req, res, next) => {
  try {
    // 使用 IP 地址作为限流 key
    await limiter.consume(req.ip);
    next(); // 放行
  } catch (rejRes) {
    if (rejRes instanceof Error) {
      return res.status(500).send("Internal Server Error");
    }
    // 【返回 429】并告诉客户端多久后可以重试
    res.set("Retry-After", String(Math.round(rejRes.msBeforeNext / 1000) || 1));
    res.status(429).send("Too Many Requests");
  }
};

app.use(rateLimiterMiddleware);
app.get("/", (req, res) => res.send("Hello World"));
app.listen(3000);
```

### 4. Redis 分布式限流最小示例

```js
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

// 【Redis 客户端】生产环境建议关闭离线队列，防止内存溢出
const redisClient = new Redis({ enableOfflineQueue: false });

// 【Redis 限流器】跨进程/多实例共享限流状态
const limiter = new RateLimiterRedis({
  storeClient: redisClient, // 【存储客户端】传入 Redis 实例
  keyPrefix: "api_limit", // 【键前缀】避免多个限流器 key 冲突
  points: 20, // 每 5 秒最多 20 点
  duration: 5,
  blockDuration: 10, // 【阻塞时长】积分耗尽后额外阻塞 10 秒
});

async function apiHandler(userId) {
  try {
    const res = await limiter.consume(userId);
    return { allowed: true, remaining: res.remainingPoints };
  } catch (rejRes) {
    if (rejRes instanceof Error) {
      // Redis 不可用时的兜底处理
      return { allowed: false, reason: "store_error" };
    }
    return {
      allowed: false,
      reason: "rate_limited",
      retryAfterMs: rejRes.msBeforeNext,
    };
  }
}
```

---

## 第二步：常用 API 详解

> 所有限流器（Memory、Redis、Mongo 等）共享同一套 API 接口。所有方法均返回 Promise。

### `consume(key, points = 1, options = {})`

```js
// 【消耗积分】对指定 key 消耗若干积分
const res = await rateLimiter.consume("user_123", 1);
```

- **参数：**
  - `key`：限流键，可以是 IP、用户 ID、Token、路由等任意字符串
  - `points`：本次消耗的积分数，默认 1
  - `options.customDuration`：仅对当前 key 生效的自定义 duration（仅在新窗口第一次调用时生效，不能覆盖已存在的 key）
- **返回值（resolve）：** `RateLimiterRes` 对象，表示消耗成功
- **拒绝（reject）：**
  - 存储错误 → `Error` 对象
  - 积分耗尽或 key 被阻塞 → `RateLimiterRes` 对象

### `get(key)`

```js
// 【查询状态】获取当前 key 的限流状态，不消耗积分
const res = await rateLimiter.get("user_123");
if (res) {
  console.log("已用积分:", res.consumedPoints);
} else {
  console.log("该 key 无记录或已过期");
}
```

- 始终返回 `RateLimiterRes`，但 `isFirstInDuration` 永远为 `false`
- 若 key 不存在或已过期，返回 `null`
- **注意：** 读取成本远低于 `consume`（尤其是数据库后端），适合高频读场景

### `set(key, points, secDuration)`

```js
// 【手动设置】直接设置 key 的已消耗积分数和持续时间
await rateLimiter.set("user_123", 5, 60); // 60 秒内已消耗 5 点
```

- `secDuration = 0` 时，数据永不过期（可作为永久计数器）
- 返回 `RateLimiterRes`

### `penalty(key, points = 1)`

```js
// 【惩罚扣分】语义化地扣除积分，积分不足时不会抛异常，而是正常 resolve
const res = await rateLimiter.penalty("user_123", 2);
```

- 与 `consume` 的区别：`consume` 在积分耗尽时会 reject，`penalty` 永远 resolve
- 适用于“记录失败次数但不想直接阻塞”的场景

### `reward(key, points = 1)`

```js
// 【奖励加分】减少已消耗积分，用于奖励良好行为
const res = await rateLimiter.reward("user_123", 1);
```

- 比如用户完成了二次验证，可以减少之前因密码错误累积的惩罚积分

### `block(key, secDuration)`

```js
// 【手动阻塞】立即阻塞某个 key 指定秒数
await rateLimiter.block("attacker_ip", 300); // 阻塞 5 分钟
```

- 设置已消耗积分为 `points + 1`，强制更新过期时间
- `secDuration = 0` 表示永久阻塞，需通过 `delete` 解锁

### `delete(key)`

```js
// 【删除 key】清除所有与该 key 相关的数据
const removed = await rateLimiter.delete("user_123");
// removed: true 表示成功删除，false 表示 key 不存在
```

- 常用于登录成功后清除失败计数

### `deleteInMemoryBlockedAll()`

```js
// 【清空内存阻塞】清除所有被内存阻塞的 key
await rateLimiter.deleteInMemoryBlockedAll();
```

- 仅在配置了 `inMemoryBlockOnConsumed` 时有效

### `getKey(key)`

```js
// 【获取内部键】返回带 keyPrefix 前缀的实际存储键名
const internalKey = rateLimiter.getKey("user_123");
// 结果如: "rlflx:user_123"
```

---

### RateLimiterRes 响应对象

```ts
{
  msBeforeNext: 250,         // 【距下次重置的毫秒数】可用于设置 Retry-After
  remainingPoints: 0,        // 【剩余积分】当前窗口内还能消耗的积分数
  consumedPoints: 5,         // 【已消耗积分】当前窗口内已使用的积分数
  isFirstInDuration: false,  // 【是否本窗口首次】第一次消耗后为 true
}
```

**HTTP 响应头规范示例：**

```js
res.set(
  "Retry-After",
  String(Math.round(rateLimiterRes.msBeforeNext / 1000) || 1),
);
res.set("X-RateLimit-Limit", String(opts.points));
res.set("X-RateLimit-Remaining", String(rateLimiterRes.remainingPoints));
res.set(
  "X-RateLimit-Reset",
  String(Math.ceil((Date.now() + rateLimiterRes.msBeforeNext) / 1000)),
);
```

---

## 第三步：常用使用技巧

### 技巧 1：分层限流（全局 + 用户级）

```js
const globalLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "global_ip",
  points: 100,
  duration: 60,
  blockDuration: 60,
});

const userLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "user_id",
  points: 10,
  duration: 60,
  blockDuration: 300,
});

async function layeredLimit(req) {
  // 先全局粗略限流
  await globalLimiter.consume(req.ip);
  // 再细化到用户级别
  await userLimiter.consume(req.userId || req.ip);
}
```

### 技巧 2：登录防暴力破解（双限流器模式）

```js
// 【按 IP 每天限制】防止单一 IP 大规模扫描
const limiterSlowBruteByIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "login_fail_ip_per_day",
  points: 100,
  duration: 60 * 60 * 24, // 24 小时
  blockDuration: 60 * 60 * 24, // 超限后封锁 24 小时
});

// 【按用户名+IP 连续失败】防止针对单一账号的暴力破解
const limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "login_fail_consecutive",
  points: 10,
  duration: 60 * 60 * 24 * 90, // 90 天窗口
  blockDuration: 60 * 60, // 封锁 1 小时
});

async function onLoginFail(username, ip) {
  const key = `${username}_${ip}`;
  // 先 get（廉价读），确认有记录后再 consume
  await limiterSlowBruteByIP.consume(ip);
  await limiterConsecutiveFailsByUsernameAndIP.consume(key);
}

async function onLoginSuccess(username, ip) {
  const key = `${username}_${ip}`;
  // 登录成功后清除连续失败计数
  await limiterConsecutiveFailsByUsernameAndIP.delete(key);
}
```

### 技巧 3：认证与非认证用户差异化限流

```js
const limiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 300,
  duration: 60,
});

async function handle(req) {
  const key = req.userId ? req.userId : req.ip;
  // 登录用户每次只消耗 1 点，匿名用户消耗 30 点
  const pointsToConsume = req.userId ? 1 : 30;
  await limiter.consume(key, pointsToConsume);
}
```

### 技巧 4：内存加速策略（DoS 防护）

```js
const limiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 5,
  duration: 1,
  inMemoryBlockOnConsumed: 5, // 消耗 5 点后在进程内存中直接阻塞
  inMemoryBlockDuration: 10, // 内存中阻塞 10 秒，减少对 Redis 的请求
});
```

- **效果：** 被阻塞的 key 直接从内存拒绝，无需请求 Redis，速度提升约 7 倍
- **注意：** 仅对 `consume()` 生效；多进程/多实例场景下各实例内存独立

### 技巧 5：保险限流器（存储故障时的降级）

```js
const memoryFallback = new RateLimiterMemory({ points: 1, duration: 1 });

const limiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 5,
  duration: 1,
  insuranceLimiter: memoryFallback, // Redis 故障时自动降级到内存限流
});
```

- `insuranceLimiter` 自动继承父级的 `blockDuration` 和 `execEvenly`
- **注意：** 存储恢复后，保险限流器的数据**不会**同步回主存储

### 技巧 6：动态阻塞时长（斐波那契递增）

```js
const loginLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "login",
  points: 5,
  duration: 15 * 60,
});

const counter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "login_outoflimits",
  points: 99999,
  duration: 0, // 永不过期，作为纯计数器
});

async function onLimitReached(key) {
  await counter.penalty(key);
  const countRes = await counter.get(key);
  const blockedCount = countRes ? countRes.consumedPoints : 0;
  const fib = [1, 2, 3, 5, 8, 13, 21];
  const blockMinutes = fib[Math.min(blockedCount, fib.length - 1)];
  await loginLimiter.block(key, blockMinutes * 60);
}
```

### 技巧 7：周期性同步减少存储请求

```js
const local = new RateLimiterMemory(opts);
const remote = new RateLimiterRedis({ storeClient: redisClient, ...opts });

async function consumeWithSync(key, syncEvery = 10) {
  const memRes = await local.consume(key);
  if (memRes.consumedPoints % syncEvery === 0) {
    // 每 N 次才向 Redis 同步一次
    await remote.consume(key, syncEvery);
  }
  return memRes;
}
```

- **牺牲一致性换取性能**，适合超高流量、可容忍轻微超限的场景

### 技巧 8：BurstyRateLimiter 突发流量控制

```js
import { BurstyRateLimiter, RateLimiterMemory } from "rate-limiter-flexible";

const burstyLimiter = new BurstyRateLimiter(
  new RateLimiterMemory({ points: 2, duration: 1 }), // 基础速率：每秒 2 次
  new RateLimiterMemory({ keyPrefix: "burst", points: 5, duration: 10 }), // 突发额度：每 10 秒额外 5 次
);
```

### 技巧 9：RateLimiterUnion 多维度同时限流

```js
import { RateLimiterUnion, RateLimiterMemory } from "rate-limiter-flexible";

const limiter1 = new RateLimiterMemory({
  keyPrefix: "limit1",
  points: 1,
  duration: 1,
});
const limiter2 = new RateLimiterMemory({
  keyPrefix: "limit2",
  points: 5,
  duration: 60,
});

const union = new RateLimiterUnion(limiter1, limiter2);
// 任一限流器耗尽时都会拒绝
await union.consume("user_123");
```

### 技巧 10：WebSocket flood 防护

```js
const limiter = new RateLimiterMemory({ points: 5, duration: 1 });

io.on("connection", (socket) => {
  socket.on("bcast", async (data) => {
    try {
      await limiter.consume(socket.handshake.address);
      socket.broadcast.emit("news", data);
    } catch (rejRes) {
      socket.emit("blocked", { "retry-ms": rejRes.msBeforeNext });
    }
  });
});
```

---

## 第四步：注意事项

### 1. Redis 客户端版本与配置

- **ioredis（默认推荐）：** 无需额外配置，直接传入 `storeClient`
- **redis 包 v4+：** 必须设置 `useRedisPackage: true`
- **redis 包 v3 及以下：** 设置 `useRedis3AndLowerPackage: true`（不推荐，未完全支持）

```js
// ioredis 正确示例
const Redis = require("ioredis");
new RateLimiterRedis({ storeClient: new Redis(), points: 5, duration: 5 });

// redis v4+ 正确示例
const { createClient } = require("redis");
new RateLimiterRedis({
  storeClient: await createClient().connect(),
  useRedisPackage: true, // 必须显式声明
  points: 5,
  duration: 5,
});
```

> **常见问题：** 使用 ioredis 时如果错误设置了 `useRedisPackage: true`，会导致 Lua 脚本参数变成 `[object Object]`，Redis 报错 `ERR value is not an integer or out of range`。

### 2. 信任代理（Trust Proxy）安全

Express 应用在反向代理（Nginx、CDN）后方时，不要无条件信任 `x-forwarded-for`：

```js
// ❌ 危险：可以被伪造
app.set("trust proxy", true);

// ✅ 安全：限定特定 IP 或跳数
app.set("trust proxy", "loopback, 123.123.123.123");
// 或
app.set("trust proxy", 1); // 仅信任第一级代理
```

详见 [Express Behind Proxies](https://expressjs.com/en/guide/behind-proxies.html)。

### 3. keyPrefix 必须唯一

当运行多个限流器实例时，**每个实例必须有不同的 `keyPrefix`**，否则 key 会冲突导致限流失效。

```js
const limiterA = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "api",
  points: 10,
  duration: 60,
});
const limiterB = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "login",
  points: 5,
  duration: 60,
});
```

### 4. duration: 0 的含义

- `duration: 0` 表示积分**永不过期**，可用于永久计数器（如统计终身调用次数、永久黑名单）
- 与 `blockDuration: 0`（默认值，表示不额外阻塞）不同，不要混淆

### 5. inMemoryBlockOnConsumed 的局限性

- 只在**当前进程内存**生效，对 `consume()` 方法有效
- **多实例/集群环境下各进程独立**，一个实例内存阻塞了，其他实例仍可能允许请求通过
- 建议配合 `inMemoryBlockDuration` 使用，并与 `blockDuration` 保持一致

### 6. execEvenly（平滑流量）使用场景

- 类似漏桶算法，将请求均匀分散到时间窗口内
- **不推荐**用于 `duration` 很长但 `points` 很少的场景，否则延迟可能过长
- 适合削峰填谷，例如 `points: 100, duration: 60` 这种中等频率场景

### 7. 保险限流器的数据隔离

- `insuranceLimiter` 在存储恢复后，**数据不会回写**到主存储
- 这意味着故障期间在内存中积累的限流状态会丢失，存储恢复后从头开始计数

### 8. RateLimiterMemory 的 setTimeout 限制

- `RateLimiterMemory` 使用 `setTimeout` 管理过期，因此 `duration` 和 `blockDuration` 最大约为 **24 天（2147483 秒）**
- 需要更长周期请使用 Redis 等外部存储

### 9. 区分存储错误与限流拒绝

```js
try {
  const res = await limiter.consume(key);
} catch (rejRes) {
  if (rejRes instanceof Error) {
    // 【存储错误】如 Redis 断开、超时
    // 应记录日志并考虑降级或熔断
  } else {
    // 【限流拒绝】rejRes 是 RateLimiterRes
    res.status(429).send("Too Many Requests");
  }
}
```

### 10. Next.js / Edge Runtime 兼容性

- `rate-limiter-flexible` 的 `RateLimiterCluster` 依赖 Node.js 进程 API（`process.on` 等）
- 在 **Next.js Edge Runtime** 或 **Vercel Edge Functions** 中，这些 API 不可用，会报构建警告
- **解决方案：** 在 Edge Runtime 中仅使用 `RateLimiterMemory`，或将限流逻辑放在 Node.js Runtime 的 API Routes 中

### 11. 定期清理过期数据

- MySQL、PostgreSQL、SQLite 默认每 5 分钟自动清理过期超过 1 小时的数据（`clearExpiredByTimeout: true`）
- **Serverless 环境（AWS Lambda、GCP Functions）** 中定时器不可靠，应手动调用：

```js
await limiter.clearExpired(Date.now() - 3600000);
```

### 12. Redis 权限要求

使用 `RateLimiterRedis` 时，Redis 用户需要具备以下权限：

```
+@read +@write +EVAL +EVALSHA
```

如果权限不足，Lua 脚本执行会失败。

---

## 参考链接

- [GitHub 仓库](https://github.com/animir/node-rate-limiter-flexible)
- [API Methods Wiki](https://github.com/animir/node-rate-limiter-flexible/wiki/API-methods)
- [Options Wiki](https://github.com/animir/node-rate-limiter-flexible/wiki/Options)
- [CONTEXT.md 完整参考](https://github.com/animir/node-rate-limiter-flexible/blob/master/CONTEXT.md)
- [Express 中间件示例](https://github.com/animir/node-rate-limiter-flexible/wiki/Express-Middleware)
