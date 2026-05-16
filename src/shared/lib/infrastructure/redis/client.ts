import "server-only";

import Redis from "ioredis";

declare global {
  // 开发环境下把 Redis 实例挂到全局，避免热更新反复创建连接。
  var __redisClient__: Redis | undefined;
}

export type RedisClient = Redis;

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("Redis 配置缺失。请在环境中设置 REDIS_URL。");
  }

  return new Redis(redisUrl);
}

export function getRedisClient(): Redis {
  // 生产环境每次按正常模块加载创建实例，不走全局缓存。
  if (process.env.NODE_ENV === "production") {
    return createRedisClient();
  }

  // 开发环境复用全局单例，避免 Next 热更新期间重复建连。
  if (!global.__redisClient__) {
    global.__redisClient__ = createRedisClient();
  }

  return global.__redisClient__;
}

export const redis = getRedisClient();
