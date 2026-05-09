import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/prisma/index";
import Credentials from "next-auth/providers/credentials";
// import { skipAuthThrottling } from "../api/environment";
// import { ratelimit } from "../infrastructure/redis/reatlimit";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database", // database 会真正用到 Session 表 登录态存在数据库里, jwt 不依赖 Session 表保存会话, 登录态主要放在 cookie/JWT 里
    maxAge: 30 * 24 * 60 * 60, // 默认 session 最大生命周期是30天, 30天不活跃自动登出
    updateAge: 24 * 60 * 60, //  24小时刷新一次 session
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "prompt-shelf",
      type: "credentials",
      credentials: {
        email: {
          label: "邮箱",
          type: "email",
          // placeholder: "请输入邮箱",
        },
        password: {
          label: "密码",
          type: "password",
          // placeholder: "请输入密码",
        },
      },
      // credentials 代表上面credentials 写的配置项,用户传递的数据
      // req 代表这次调用 authorize 的请求上下文
      // async authorize(credentials, req) {
      //   if (!credentials) {
      //     throw new Error("no-credentials");
      //   }

      //   const { email, password } = credentials;

      //   if (!email || !password) {
      //     throw new Error("no-credentials");
      //   }

      //   if (!skipAuthThrottling) {
      //     await ratelimit(`login-attempts:${email}`);
      //   }
      // },
    }),
  ],
};
