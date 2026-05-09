import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "./client";

export const ratelimiter = new RateLimiterRedis({
  storeClient: redis, // 【存储客户端】Redis 连接实例，限流状态都存这里
  keyPrefix: "ratelimiter", // 【键前缀】Redis 里实际 key 会变成 "user_id:xxx"，避免跟其他限流器冲突
  points: 10, // 【积分上限】每个 key 在 duration 时间内最多能消耗 10 点
  duration: 60, // 【时间窗口】60 秒。从第一次消耗开始计时，60 秒后积分重置
  blockDuration: 300, // 【阻塞时长】积分耗尽后，额外阻塞 300 秒（5分钟），期间直接拒绝
});

export async function ratelimit(key: string) {
  await ratelimiter.consume(key, 1);
}
