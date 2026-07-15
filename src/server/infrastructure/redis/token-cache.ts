import { z } from "@/shared/lib/zod";
import { getAppRedis } from "./clients";

// # API Key 鉴权缓存层：cache-aside 模式，命中即跳过数据库往返

// ! 缓存过期时间：24 小时，与 session 时长量级一致；TTL 是被吊销令牌仍可用的时间上限
const CACHE_EXPIRATION = 60 * 60 * 24;
// Redis Key 前缀，遵循 redis/AGENTS.md 的「模块:动作:标识符」规范
const CACHE_KEY_PREFIX = "token:cache";

// Token 缓存项 schema：保存该 token 解析出的身份 + 权限信息，避免每次请求都 join user 表
const tokenCacheItemSchema = z.object({
	id: z.string(),
	userId: z.string(),
	scopes: z.string().nullish(),
	// ISO 字符串，JSON 兼容；null 表示永不过期
	expires: z.iso.datetime().nullish(),
	user: z.object({
		id: z.string(),
		name: z.string().nullable(),
		email: z.string().nullable(),
		image: z.string().nullable(),
	}),
});

export type TokenCacheItem = z.infer<typeof tokenCacheItemSchema>;

// API Key 验证缓存层：cache-aside 模式，命中即跳过数据库往返
// > Key 为 hashedKey（明文不入缓存），TTL 24h，token 删除/更新时主动清缓存
class TokenCache {
	private _key(hashedKey: string): string {
		return `${CACHE_KEY_PREFIX}:${hashedKey}`;
	}

	// 写入：parse 校验入参结构，防止脏数据进缓存
	async set(hashedKey: string, item: TokenCacheItem): Promise<void> {
		const redis = getAppRedis();
		await redis.set(
			this._key(hashedKey),
			JSON.stringify(tokenCacheItemSchema.parse(item)),
			"EX",
			CACHE_EXPIRATION,
		);
	}

	// 读取：未命中返回 null；结构校验失败按未命中处理并清掉脏数据
	async get(hashedKey: string): Promise<TokenCacheItem | null> {
		const redis = getAppRedis();
		const raw = await redis.get(this._key(hashedKey));
		if (!raw) {
			return null;
		}
		const parsed = tokenCacheItemSchema.safeParse(JSON.parse(raw));
		if (!parsed.success) {
			await redis.del(this._key(hashedKey));
			return null;
		}
		return parsed.data;
	}

	// ! 立即删除：revoke 或更新字段后必须调用，否则被吊销的令牌会在 TTL 内继续生效
	async delete(hashedKey: string): Promise<void> {
		const redis = getAppRedis();
		await redis.del(this._key(hashedKey));
	}
}

export const tokenCache = new TokenCache();
