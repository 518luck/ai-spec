// # 演示自动登录端点：用种子账号免密登录，供面试展示
// > 由 middleware 检测到未登录且未 opt-out 时重定向到本路由触发登录

import { NextResponse } from "next/server";
import { signIn } from "@/shared/lib/auth/auth";

// 种子账号（与 scripts/db/user.ts 保持一致）
// ! 通过环境变量配置，避免硬编码；DEMO_AUTO_LOGIN_ENABLED=false 时完全关闭
const DEMO_EMAIL = process.env.DEMO_AUTO_LOGIN_EMAIL ?? "zhangluck59811@gmail.com";
const DEMO_PASSWORD = process.env.DEMO_AUTO_LOGIN_PASSWORD ?? "kAbbI8IhHUISw1";
const DEMO_ENABLED = process.env.DEMO_AUTO_LOGIN_ENABLED !== "false";

// GET /api/auth/auto-login?callbackUrl=/xxx：用种子账号登录后跳回原页面
export async function GET(request: Request): Promise<Response> {
	const { searchParams, origin } = new URL(request.url);
	const callbackUrl = searchParams.get("callbackUrl") ?? "/spec/personal";

	// 开关关闭时直接跳登录页，不做自动登录
	if (!DEMO_ENABLED) {
		return NextResponse.redirect(`${origin}/spec/login`);
	}

	try {
		// 服务端程序化登录：signIn 会种 session cookie 到响应里
		await signIn("credentials", {
			email: DEMO_EMAIL,
			password: DEMO_PASSWORD,
			redirect: false,
		});
		return NextResponse.redirect(`${origin}${callbackUrl}`);
	} catch {
		// 种子账号不存在或密码错误等异常，回退到登录页
		return NextResponse.redirect(`${origin}/spec/login`);
	}
}
