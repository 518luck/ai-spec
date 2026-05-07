import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/prisma/index";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database", // database 会真正用到 Session 表 登录态存在数据库里, jwt 不依赖 Session 表保存会话, 登录态主要放在 cookie/JWT 里
    maxAge: 30 * 24 * 60 * 60, // 默认 session 最大生命周期是30天, 30天不活跃自动登出
    updateAge: 24 * 60 * 60, //  24小时刷新一次 session
  },
  providers: [],
};
