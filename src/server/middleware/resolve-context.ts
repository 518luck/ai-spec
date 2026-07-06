// 认证内核：解析请求身份（API Key 或 cookies session），供高阶函数复用
//
// 当前唯一消费者是 withSession。预留给未来的 SDK / 脚本 / CI 等场景：
// 这些场景可能需要自定义鉴权链路（比如跳过限流、注入固定身份），
// 直接调 resolveContext 拿到 { session, rateInfo } 即可，不必重写认证逻辑。
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import type { RateLimiterRes } from "rate-limiter-flexible";
import { AiSpecError } from "@/server/errors/http-error";
import { apiKeyRatelimit } from "@/server/infrastructure/redis/reatlimit";
import { type TokenCacheItem, tokenCache } from "@/server/infrastructure/redis/token-cache";
import prisma from "@/shared/db";
import { auth } from "@/shared/lib/auth/auth";
import { hashToken } from "@/shared/lib/auth/hash-token";

// 认证解析结果：身份 session 与（API Key 分支独有的）限流信息、权限范围
type ResolveResult = {
	session: Session;
	rateInfo: RateLimiterRes | null;
	// API Key 接入时为该 Key 的 scope 数组；cookies 接入时为 null（不走 scope 校验，靠 owner_id 隔离）
	scopes: string[] | null;
};

// API Key 限流窗口上限，对应 apiKeyLimiter 的 points
const RATE_LIMIT_MAX = 60;
// Authorization 头中 Bearer 方案前缀
const BEARER_PREFIX = "Bearer ";
// 与 cookies 分支保持一致的 session 最大有效期（30 天，单位毫秒）
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// 解析身份：Bearer 走 API Key（含限流），否则走 cookies session
export const resolveContext = async (req: NextRequest): Promise<ResolveResult> => {
	const authHeader = req.headers.get("authorization") ?? "";

	// 携带 Bearer 头视为 SDK 通过 API Key 接入
	if (authHeader.startsWith(BEARER_PREFIX)) {
		const token = await resolveApiKeyToken(authHeader.slice(BEARER_PREFIX.length));
		const { ok, res } = await apiKeyRatelimit({
			key: `api:requests:${token.user_id}`,
		});

		if (!ok) {
			throw new AiSpecError({
				code: "RATE_LIMITED",
				message: `请求过于频繁，请 ${Math.ceil(res.msBeforeNext / 1000)} 秒后重试`,
			});
		}

		// 仅在限流窗口的首次请求时更新 last_used，避免每个请求都写库。
		// consumedPoints 是当前 60 秒窗口内累计消耗的积分总数，等于 1 即代表窗口首请求。
		if (res.consumedPoints === 1) {
			await prisma.token.update({
				where: { id: token.id },
				data: { last_used: new Date() },
			});
		}

		// scopes 为空格分隔字符串，split 成数组供下游 withPersonal 做权限校验；空/ null 视为无 scope
		return {
			session: buildSessionFromUser(token.user),
			rateInfo: res,
			scopes: token.scopes ? token.scopes.split(" ") : [],
		};
	}

	// 未携带 API Key，走 web 端 cookies session 分支
	const cookieSession = await auth();
	if (!cookieSession) {
		throw new Error("未登录");
	}
	// cookies 接入不走 scope 校验：浏览器用户的权限由 owner_id 数据隔离兜底
	return { session: cookieSession, rateInfo: null, scopes: null };
};

// 通过 API Key 解析出未过期的 Token 及其关联用户
// 走 cache-aside：先查 Redis 缓存（命中即跳过数据库往返），未命中再查库并回填缓存
const resolveApiKeyToken = async (rawKey: string): Promise<TokenCacheItem> => {
	const hashedKey = await hashToken(rawKey);

	// 1. 先查缓存：命中则零数据库往返
	const cached = await tokenCache.get(hashedKey);
	if (cached) {
		// 缓存里也要走过期校验：token 可能已过期但缓存还没失效
		if (cached.expires && new Date(cached.expires) < new Date()) {
			// 顺手清理过期项，避免后续请求继续命中过期缓存
			await tokenCache.delete(hashedKey);
			throw new Error("API Key 已过期");
		}
		return cached;
	}

	// 2. 缓存未命中 → 查数据库
	const token = await prisma.token.findFirst({
		where: { hashed_key: hashedKey },
		select: {
			id: true,
			user_id: true,
			scopes: true,
			expires: true,
			user: { select: { id: true, name: true, email: true, image: true } },
		},
	});

	if (!token) {
		throw new Error("无效的 API Key");
	}
	if (token.expires && token.expires < new Date()) {
		throw new Error("API Key 已过期");
	}

	// 3. 回填缓存：把 Date 统一转成 ISO 字符串以保持 JSON 兼容
	const cacheItem: TokenCacheItem = {
		id: token.id,
		user_id: token.user_id,
		scopes: token.scopes,
		expires: token.expires?.toISOString() ?? null,
		user: token.user,
	};
	await tokenCache.set(hashedKey, cacheItem);

	return cacheItem;
};

// 把 User 记录构造为与 cookies 分支同构的 Session
const buildSessionFromUser = (user: {
	id: string;
	name: string | null;
	email: string | null;
	image: string | null;
}): Session => ({
	user: {
		id: user.id,
		name: user.name,
		email: user.email,
		image: user.image,
	},
	expires: new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString(),
});

// 限流窗口上限，导出供 withSession 写响应头时使用
export const RATE_LIMIT_MAX_POINTS = RATE_LIMIT_MAX;
