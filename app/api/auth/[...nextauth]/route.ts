import { handlers } from "@/shared/lib/auth/auth";

// # NextAuth App Router 认证入口（GET/POST 统一代理到 handlers）

// 提供 NextAuth 的 App Router 认证入口。
export const { GET, POST } = handlers;
