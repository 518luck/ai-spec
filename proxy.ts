import { type NextRequest, NextResponse } from "next/server";

// # 请求代理层：Next.js 16 由 proxy.ts 接管原 middleware 的职责
// > 职责 1：演示自动登录（未登录访客自动用种子账号登录，面试展示用）
// > 职责 2：预留工作空间跳转入口（TODO）

// 构建期静态分析的路由过滤器，决定 proxy 函数对哪些请求生效
export const config = {
	matcher: ["/((?!api/|_next/|_proxy/|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)"],
};

// 生产环境的 session cookie 带 __Secure- 前缀，开发环境是 ai-spec.session-token
const SESSION_COOKIE_KEY = "ai-spec.session-token";
// 主动退出后种的标记 cookie，存在则不再自动登录
const OPT_OUT_COOKIE = "ai-spec.guest-opt-out";

// 演示自动登录：仅 DEMO_AUTO_LOGIN_ENABLED 时生效
// 触发条件：未登录 + 未 opt-out + 访问的不是登录/注册页
export function proxy(request: NextRequest) {
	const { pathname, search, origin } = request.nextUrl;

	// 登录/注册页放行，避免循环重定向
	if (/\/spec\/(login|register|auth)/.test(pathname)) {
		return NextResponse.next();
	}

	// 功能关闭直接放行
	if (process.env.DEMO_AUTO_LOGIN_ENABLED === "false") {
		return NextResponse.next();
	}

	const hasSession =
		request.cookies.get(SESSION_COOKIE_KEY)?.value ||
		request.cookies.get(`__Secure-${SESSION_COOKIE_KEY}`)?.value;
	const hasOptOut = request.cookies.get(OPT_OUT_COOKIE)?.value;

	// 已登录或已 opt-out：放行
	if (hasSession || hasOptOut) {
		return NextResponse.next();
	}

	// 未登录且未 opt-out：重定向到自动登录端点
	const callbackUrl = encodeURIComponent(`${pathname}${search}`);
	return NextResponse.redirect(`${origin}/api/auth/auto-login?callbackUrl=${callbackUrl}`);
}
