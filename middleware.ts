// # 演示自动登录中间件：未登录访客自动用种子账号登录
// > 仅在 DEMO_AUTO_LOGIN_ENABLED 时生效；已登录或已 opt-out 的访客不受影响
//
// 触发条件（同时满足）：
// 1. 功能开关开启
// 2. 无 session cookie（未登录）
// 3. 无 opt-out cookie（用户主动退出过，尊重其选择）
// 4. 访问的不是登录/认证相关页面（避免循环重定向）

import { type NextRequest, NextResponse } from "next/server";

// 生产环境的 session cookie 带 __Secure- 前缀，开发环境是 ai-spec.session-token
const SESSION_COOKIE_PREFIX = "ai-spec.session-token";
// 主动退出后种的标记 cookie，存在则不再自动登录
const OPT_OUT_COOKIE = "ai-spec.guest-opt-out";

// 排除的路径：API、静态资源、认证页面（避免登录页自身触发自动登录导致死循环）
const EXCLUDED_PATTERN =
	/\/(_next\/|api\/auth\/|spec\/login|spec\/register|spec\/auth|favicon|icon|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map))/;

export default async function middleware(request: NextRequest) {
	const { pathname, search, origin } = request.nextUrl;

	// 排除路径直接放行
	if (EXCLUDED_PATTERN.test(pathname)) {
		return NextResponse.next();
	}

	// 功能关闭直接放行
	if (process.env.DEMO_AUTO_LOGIN_ENABLED === "false") {
		return NextResponse.next();
	}

	const hasSession =
		request.cookies.get(SESSION_COOKIE_PREFIX)?.value ||
		request.cookies.get(`__Secure-${SESSION_COOKIE_PREFIX}`)?.value;
	const hasOptOut = request.cookies.get(OPT_OUT_COOKIE)?.value;

	// 已登录或已 opt-out：放行
	if (hasSession || hasOptOut) {
		return NextResponse.next();
	}

	// 未登录且未 opt-out：重定向到自动登录，带上原路径方便登录后跳回
	const callbackUrl = encodeURIComponent(`${pathname}${search}`);
	return NextResponse.redirect(`${origin}/api/auth/auto-login?callbackUrl=${callbackUrl}`);
}

export const config = {
	runtime: "nodejs" as const,
	// 匹配所有路径（排除项在 middleware 内部用正则处理，更灵活）
	matcher: ["/((?!_next/static|_next/image).*)"],
};
