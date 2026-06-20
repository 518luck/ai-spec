import prisma from "@/shared/db";
import { AiSpecError, toErrorResponse } from "@/shared/lib/api/error";
import { auth } from "@/shared/lib/auth/auth";
import { withAxiom } from "@/shared/lib/infrastructure/axiom/server";
import { apiKeyRatelimit } from "@/shared/lib/infrastructure/redis/reatlimit";
import { getSearchParams } from "@/shared/lib/utils";
import type { Session } from "next-auth";
import { type NextRequest } from "next/server";
import type { RateLimiterRes } from "rate-limiter-flexible";
import { hashToken } from "./hash-token";

// Next.js App Router 动态路由上下文类型
type RouteContext = { params: Promise<Record<string, string | string[]>> };

// withSession 传给业务 handler 的全部上下文：请求对象、路由上下文、身份 session 与 URL 查询参数
type SessionHandlerArgs = {
  req: NextRequest;
  ctx: RouteContext;
  session: Session;
  searchParams: Record<string, string>;
};

// 被 withSession 包装的业务 handler 签名：接收单一对象参数
type SessionHandler = (
  args: SessionHandlerArgs,
) => Promise<Response> | Response;

// API Key 限流窗口上限，对应 apiKeyLimiter 的 points
const RATE_LIMIT_MAX = 60;

// Authorization 头中 Bearer 方案前缀
const BEARER_PREFIX = "Bearer ";

// 与 cookies 分支保持一致的 session 最大有效期（30 天，单位毫秒）
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// 把限流结果写入响应头；被限流时额外写入 Retry-After
const applyRateLimitHeaders = (
  headers: Headers,
  info: RateLimiterRes | null,
  includeRetryAfter: boolean,
): void => {
  if (!info) {
    return;
  }
  headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  headers.set("X-RateLimit-Remaining", String(info.remainingPoints));
  headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil((Date.now() + info.msBeforeNext) / 1000)),
  );
  if (includeRetryAfter) {
    headers.set("Retry-After", String(Math.ceil(info.msBeforeNext / 1000)));
  }
};

// 给业务 handler 的成功响应追加限流响应头
const withRateLimitHeaders = (
  response: Response,
  info: RateLimiterRes | null,
): Response => {
  if (!info) {
    return response;
  }
  const headers = new Headers(response.headers);
  applyRateLimitHeaders(headers, info, false);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

// 通过 API Key 解析出未过期的 Token 及其关联用户
const resolveApiKeyToken = async (rawKey: string) => {
  const hashedKey = await hashToken(rawKey);
  const token = await prisma.token.findFirst({
    where: { hashedkey: hashedKey },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  if (!token) {
    throw new Error("无效的 API Key");
  }
  if (token.expires < new Date()) {
    throw new Error("API Key 已过期");
  }

  return token;
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

// 高阶函数：把业务 handler 转换为带统一鉴权、限流与错误封装的 Next.js route handler
export const withSession = (handler: SessionHandler) =>
  withAxiom(async (req: NextRequest, ctx: RouteContext) => {
    let rateInfo: RateLimiterRes | null = null;

    try {
      let session: Session;

      const authHeader = req.headers.get("authorization") ?? "";

      // 携带 Bearer 头视为 SDK 通过 API Key 接入
      if (authHeader.startsWith(BEARER_PREFIX)) {
        const token = await resolveApiKeyToken(
          authHeader.slice(BEARER_PREFIX.length),
        );
        const { ok, res } = await apiKeyRatelimit({
          key: `api:requests:${token.userId}`,
        });
        rateInfo = res;

        if (!ok) {
          throw new AiSpecError({
            code: "RATE_LIMITED",
            message: `请求过于频繁，请 ${Math.ceil(res.msBeforeNext / 1000)} 秒后重试`,
          });
        }

        // 借限流窗口：本分钟第一次请求才写 lastUsed，避免每次请求都落库
        if (res.consumedPoints === 1) {
          await prisma.token.update({
            where: { id: token.id },
            data: { lastUsed: new Date() },
          });
        }

        session = buildSessionFromUser(token.user);
      } else {
        // 未携带 API Key，走 web 端 cookies session 分支
        const cookieSession = await auth();

        if (!cookieSession) {
          throw new Error("未登录");
        }

        session = cookieSession;
      }

      const searchParams = getSearchParams(req.url);

      const response = await handler({ req, ctx, session, searchParams });

      return withRateLimitHeaders(response, rateInfo);
    } catch (e) {
      const headers = new Headers();
      applyRateLimitHeaders(
        headers,
        rateInfo,
        e instanceof AiSpecError && e.code === "RATE_LIMITED",
      );
      return toErrorResponse(e, headers);
    }
  });
