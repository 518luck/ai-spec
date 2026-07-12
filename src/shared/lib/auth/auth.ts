import NextAuth from "next-auth";
import { authOptions } from "./options";

// # NextAuth 入口：导出路由 handlers、auth 中间件、signIn / signOut 方法
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
