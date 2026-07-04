import { RateLimiterRedis, type RateLimiterRes } from "rate-limiter-flexible";
import { getAppRedis } from "./clients";

export const ratelimiter = new RateLimiterRedis({
	storeClient: getAppRedis(), // 【存储客户端】Redis 连接实例，限流状态都存这里
	keyPrefix: "ratelimiter", // 【键前缀】Redis 里实际 key 会变成 "user_id:xxx"，避免跟其他限流器冲突
	points: 10, // 【积分上限】每个 key 在 duration 时间内最多能消耗 10 点
	duration: 60, // 【时间窗口】60 秒。从第一次消耗开始计时，60 秒后积分重置
	blockDuration: 300, // 【阻塞时长】积分耗尽后，额外阻塞 300 秒（5分钟），期间直接拒绝
});

// API Key 鉴权专用限流器：每个 key 60 秒内最多 60 次请求，耗尽后到窗口结束前拒绝
export const apiKeyLimiter = new RateLimiterRedis({
	storeClient: getAppRedis(),
	keyPrefix: "api-key", // 独立键前缀，避免与通用限流器键冲突
	points: 60,
	duration: 60,
});

// 硬性每日限流器：每日 10 积分，超额后锁到当天窗口结束（不设 blockDuration，避免短阻塞重置日窗口），供多个"每日 N 次"认证流程复用
export const hardDailyLimiter = new RateLimiterRedis({
	storeClient: getAppRedis(),
	keyPrefix: "hard-daily", // 独立键前缀，与通用限流器隔离
	points: 10,
	duration: 24 * 60 * 60, // 1 天固定窗口
});

type RatelimitOptions = {
	key: string;
	points?: number;
	duration?: number;
};

// 基于 Redis 的频率限制（限流）工具函数。
// points 表示本次请求要消耗多少积分，默认一次请求消耗 1 点；duration 表示本次 key 的时间窗口，单位是秒。
export async function ratelimit({ key, points = 1, duration }: RatelimitOptions) {
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
		throw new Error(`请求过于频繁，请 ${Math.ceil(res.msBeforeNext / 1000)} 秒后重试`);
	}
}

// API Key 限流的返回值：ok 表示本次是否放行，res 携带剩余积分/重置时间用于写响应头
type ApiKeyRatelimitResult = {
	ok: boolean;
	res: RateLimiterRes;
};

// API Key 限流入参：key 为限流桶标识，points 为本次消耗的积分数（默认 1）
type ApiKeyRatelimitOptions = {
	key: string;
	points?: number;
};

// 硬性每日限流入参：key 为限流桶标识（实际 Redis key 会带 "hard-daily:" 前缀），points 为本次消耗积分
type HardDailyRatelimitOptions = {
	key: string;
	points?: number;
};

// 硬性每日限流：points 指定本次消耗积分，超额抛错（沿用 ratelimit 的抛错语义）
export async function hardDailyRatelimit({
	key,
	points = 1,
}: HardDailyRatelimitOptions): Promise<RateLimiterRes> {
	try {
		return await hardDailyLimiter.consume(key, points);
	} catch (rejRes: unknown) {
		if (rejRes instanceof Error) {
			throw new Error("限流服务异常");
		}
		const res = rejRes as RateLimiterRes;
		throw new Error(`请求过于频繁，请 ${Math.ceil(res.msBeforeNext / 1000)} 秒后重试`);
	}
}

// API Key 鉴权专用限流：被限流时不抛错，而是返回 ok:false，由调用方决定如何响应（例如返回 429 并附带限流响应头）
export async function apiKeyRatelimit({
	key,
	points = 1,
}: ApiKeyRatelimitOptions): Promise<ApiKeyRatelimitResult> {
	try {
		const res = await apiKeyLimiter.consume(key, points);
		return { ok: true, res };
	} catch (rejRes: unknown) {
		// Redis 本身异常时仍按错误抛出，交由上层统一处理
		if (rejRes instanceof Error) {
			throw new Error("限流服务异常");
		}
		// 被限流：返回带拒绝信息的限流结果，方便上层构造 429 响应头
		return { ok: false, res: rejRes as RateLimiterRes };
	}
}
