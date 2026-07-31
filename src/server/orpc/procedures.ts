// # oRPC 基础 procedure：鉴权中间件链 + scope 校验，平移现有 withPersonal/withSession

import { ORPCError } from "@orpc/client";
import { os } from "@orpc/server";
import type { Session } from "next-auth";
import type { RateLimiterRes } from "rate-limiter-flexible";
import { resolveContext } from "@/server/middleware/resolve-context";
import type { Action } from "@/server/rbac/actions";
import { formatScope } from "@/server/rbac/scopes";
import type { ORPCContext } from "./context";

// 身份解析后的 context 形状：session/rateInfo/scopes 已注入（authProvider 执行后的状态）
type ResolvedContext = {
	request: ORPCContext["request"];
	session: Session;
	rateInfo: RateLimiterRes | null;
	scopes: string[] | null;
	authLoaded: boolean;
};

// 基础 builder：绑定项目 context 类型，所有 procedure 从它派生
const base = os.$context<ORPCContext>();

// 身份解析中间件：原样复用 resolveContext（Bearer→API Key+限流，否则→cookies session）
// 用 authLoaded 标志做 dedupe：链式复用或 procedure 互调时只解析一次，避免重复消耗限流积分
const authProvider = base.middleware(
	async ({
		context,
		next,
	}): Promise<{
		output: unknown;
		context: ResolvedContext;
	}> => {
		// 已解析过：直接透传已有身份，不重复消耗限流积分
		if (context.authLoaded && context.session) {
			return next({
				context: {
					request: context.request,
					session: context.session,
					rateInfo: context.rateInfo ?? null,
					scopes: context.scopes ?? null,
					authLoaded: true,
				},
			});
		}
		const { session, rateInfo, scopes } = await resolveContext(context.request);
		return next({
			context: {
				request: context.request,
				session,
				rateInfo,
				scopes,
				authLoaded: true,
			},
		});
	},
);

// 公开 procedure：仅注入身份但不强制登录（如 discover 读接口后续可放宽）
export const publicProcedure = base.use(authProvider);

// 受保护 procedure：在 authProvider 基础上强制要求已登录
// session 由 resolveContext 保证（未登录时它已抛 UNAUTHORIZED，这里做类型收窄兜底）
export const protectedProcedure = publicProcedure.use(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED", { message: "未登录" });
	}
	return next({ context: { session: context.session } });
});

// scope 校验工厂：仅对 API Key 接入（scopes 非 null）收紧权限，cookies 分支靠 ownerId 隔离
// 平移 withPersonal 的 permissions 逻辑；保留现有"不做通配展开"语义（照搬 includes 字符串匹配）
const requireScope = (permissions: readonly Action[]) =>
	protectedProcedure.use(async ({ context, next }) => {
		const { scopes } = context;
		if (scopes && scopes.length > 0) {
			const missing = permissions.filter((p) => !scopes.includes(p));
			if (missing.length > 0) {
				const missingLabel = missing.map((s) => formatScope(s)).join("、");
				throw new ORPCError("FORBIDDEN", {
					message: `当前 API Key 权限不足，缺少所需 scope：${missingLabel}`,
				});
			}
		}
		return next({ context });
	});

// 个人空间受保护 procedure：带 scope 校验（替代原 withPersonal(handler, {permissions})）
export const personalProcedure = (options?: { permissions?: readonly Action[] }) =>
	options?.permissions ? requireScope(options.permissions) : protectedProcedure;

export { base };
