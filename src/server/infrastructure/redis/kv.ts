import { getAppRedis } from "./clients";

// # 业务 KV：带 TTL 的 JSON 读写，用于邮箱变更上下文等一次性数据

// 模块级缓存 KV 连接，避免每次读写都新建 Redis 实例造成连接泄漏
const redis = getAppRedis();

// ! 写入一条带过期时间的 JSON 数据；ttlSeconds 必须显式传入，避免验证上下文长期残留
export const kvSet = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
	await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
};

// 读取并反序列化一条 JSON 数据，缺失或解析失败时返回 null
export const kvGet = async <T>(key: string): Promise<T | null> => {
	const raw = await redis.get(key);
	if (!raw) {
		return null;
	}
	return JSON.parse(raw) as T;
};

// 删除指定 key（用于清理一次性验证上下文等）
export const kvDel = async (key: string): Promise<void> => {
	await redis.del(key);
};
