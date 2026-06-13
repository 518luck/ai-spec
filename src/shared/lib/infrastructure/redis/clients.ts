import "server-only";

import Redis from "ioredis";

declare global {
  // 开发环境下把 Redis 实例挂到全局，避免热更新反复创建连接
  var __ratelimitRedis__: Redis | undefined;
  var __bullmqRedis__: Redis | undefined;
}

// 创建 Redis 连接，由调用方决定重试策略
function createRedisClient(maxRetriesPerRequest?: number | null): Redis {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("Redis 配置缺失。请在环境中设置 REDIS_URL。");
  }

  return new Redis(redisUrl, { maxRetriesPerRequest });
}

// 限流专用连接（默认重试 20 次，Redis 故障时快速报错）
export function getRatelimitRedis(): Redis {
  if (process.env.NODE_ENV === "production") {
    return createRedisClient();
  }

  if (!global.__ratelimitRedis__) {
    global.__ratelimitRedis__ = createRedisClient();
  }

  return global.__ratelimitRedis__;
}

// BullMQ 队列专用连接（无限重试，Redis 恢复后自动重连）
export function getBullMQRedis(): Redis {
  if (process.env.NODE_ENV === "production") {
    return createRedisClient(null);
  }

  if (!global.__bullmqRedis__) {
    global.__bullmqRedis__ = createRedisClient(null);
  }

  return global.__bullmqRedis__;
}
