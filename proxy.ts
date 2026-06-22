import { auth } from "@/shared/lib/auth/auth";
import type { NextRequest } from "next/server";

// 构建期静态分析的路由过滤器，决定 proxy 函数对哪些请求生效。
export const config = {
  matcher: [
    "/((?!api/|_next/|_proxy/|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)",
  ],
};

export async function proxy(request: NextRequest) {
  const session = await auth();
  console.log("🚀 ~ auth:", session);
}
