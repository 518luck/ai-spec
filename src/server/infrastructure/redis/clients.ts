import Redis from "ioredis";

// # Redis 连接工厂：区分应用侧（fail-fast）与消费侧（无限重试）两套连接

// 开发环境用 globalThis 缓存连接，避免 Next.js 热更新反复创建；生产环境由模块级变量保证单例
const globalForRedis = globalThis as unknown as {
	__appRedis?: Redis;
	__workerRedis?: Redis;
};

// 应用侧 fail-fast 连接的模块级缓存（生产环境单例）
let appRedis: Redis | undefined;
// 消费侧无限重试连接的模块级缓存（生产环境单例）
let workerRedis: Redis | undefined;

// 创建 Redis 连接，由调用方决定重试策略
function createRedisClient(maxRetriesPerRequest?: number | null): Redis {
	const redisUrl = process.env.REDIS_URL;

	if (!redisUrl) {
		throw new Error("Redis 配置缺失。请在环境中设置 REDIS_URL。");
	}

	return new Redis(redisUrl, { maxRetriesPerRequest });
}

// ! 应用侧 fail-fast 连接：限流、KV、BullMQ 生产者共用；Redis 故障时快速报错，不挂住 HTTP 请求
export function getAppRedis(): Redis {
	if (process.env.NODE_ENV !== "production") {
		if (!globalForRedis.__appRedis) {
			globalForRedis.__appRedis = createRedisClient();
		}
		return globalForRedis.__appRedis;
	}

	if (!appRedis) {
		appRedis = createRedisClient();
	}
	return appRedis;
}

// > 消费侧无限重试连接：仅 BullMQ Worker 使用，Redis 恢复后自动重连继续取任务
export function getWorkerRedis(): Redis {
	if (process.env.NODE_ENV !== "production") {
		if (!globalForRedis.__workerRedis) {
			globalForRedis.__workerRedis = createRedisClient(null);
		}
		return globalForRedis.__workerRedis;
	}

	if (!workerRedis) {
		workerRedis = createRedisClient(null);
	}
	return workerRedis;
}
