import "server-only";

import Redis from "ioredis";

import { getRedisConnectionConfig } from "./config";

declare global {
  // 开发环境下把 Redis 实例挂到全局，避免热更新反复创建连接。
  var __redisClient__: Redis | undefined;
}

export type RedisClient = Redis;

function createRedisClient(): Redis {
  // 从配置层读取连接参数，再统一创建 Redis 客户端。
  const config = getRedisConnectionConfig();

  if (!config) {
    throw new Error("Redis 配置缺失。请在环境中设置 REDIS_URL 或 REDIS_HOST。");
  }

  if ("url" in config) {
    // 云端或托管 Redis 可以直接使用完整连接串。
    return new Redis(config.url);
  }

  // 本地或常规 Redis 使用 host/port 方式连接。
  return new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    username: config.username,
  });
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
