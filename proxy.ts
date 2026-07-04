import { NextResponse } from "next/server";

// 构建期静态分析的路由过滤器，决定 proxy 函数对哪些请求生效。
export const config = {
	matcher: ["/((?!api/|_next/|_proxy/|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)"],
};

// 请求放行层，当前无逻辑，预留工作空间跳转入口
export function proxy() {
	// TODO：后面有工作空间的时候需要添加工作空间的跳转
	return NextResponse.next();
}
