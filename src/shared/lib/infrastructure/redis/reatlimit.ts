import { RateLimiterRedis, type RateLimiterRes } from "rate-limiter-flexible";
import { redis } from "./client";

export const ratelimiter = new RateLimiterRedis({
  storeClient: redis, // 【存储客户端】Redis 连接实例，限流状态都存这里
  keyPrefix: "ratelimiter", // 【键前缀】Redis 里实际 key 会变成 "user_id:xxx"，避免跟其他限流器冲突
  points: 10, // 【积分上限】每个 key 在 duration 时间内最多能消耗 10 点
  duration: 60, // 【时间窗口】60 秒。从第一次消耗开始计时，60 秒后积分重置
  blockDuration: 300, // 【阻塞时长】积分耗尽后，额外阻塞 300 秒（5分钟），期间直接拒绝
});

type RatelimitOptions = {
  key: string;
  points?: number;
  duration?: number;
};

// 基于 Redis 的频率限制（限流）工具函数。
// points 表示本次请求要消耗多少积分，默认一次请求消耗 1 点；duration 表示本次 key 的时间窗口，单位是秒。
export async function ratelimit({
  key,
  points = 1,
  duration,
}: RatelimitOptions) {
  try {
    // 返回值
    //     {
    //         msBeforeNext: 45000,      // 距下次重置还有多少毫秒
    //         remainingPoints: 9,       // 还剩多少积分
    //         consumedPoints: 1,        // 已经用了多少积分
    //         isFirstInDuration: true   // 是不是这个窗口的第一次请求
    //     }
    return await ratelimiter.consume(
      key,
      points,
      duration === undefined ? undefined : { customDuration: duration },
    );
  } catch (rejRes: unknown) {
    if (rejRes instanceof Error) {
      throw new Error("限流服务异常");
    }
    const res = rejRes as RateLimiterRes;
    // 被限流了
    throw new Error(
      `请求过于频繁，请 ${Math.ceil(res.msBeforeNext / 1000)} 秒后重试`,
    );
  }
}
