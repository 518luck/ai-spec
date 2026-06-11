import { appConfig } from "@/shared/configs/app.config";
import prisma from "@/shared/db";
import { skipAuthThrottling } from "@/shared/lib/api/environment";
import { SESSION_TOKEN_NAME } from "@/shared/lib/auth/constants";
import {
  hasReachedMaxInvalidLoginAttempts,
  recordInvalidLoginAttempt,
} from "@/shared/lib/auth/lock-account";
import { ratelimit } from "@/shared/lib/infrastructure/redis/reatlimit";
import { validatePassword } from "@/shared/lib/utils";
import { signInSchema } from "@/shared/lib/zod/schemas/auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { isProd } from "./constants";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  providers: [
    Credentials({
      id: "credentials",
      name: appConfig.appName,
      type: "credentials",
      credentials: {
        email: {
          label: "邮箱",
          type: "email",
        },
        password: {
          label: "密码",
          type: "password",
        },
      },
      // 邮箱密码登录验证：限流 → 查用户 → 锁定检查 → 密码校验
      authorize: async (credentials) => {
        const { email, password } = signInSchema.parse(credentials);

        // 如果没有启用跳过认证限流，则对登录尝试进行限流，限制每分钟最多5次尝试
        if (!skipAuthThrottling) {
          await ratelimit({
            key: `login:attempts:${email}`,
            points: 2,
            duration: 60,
          });
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            passwordHash: true,
            name: true,
            email: true,
            image: true,
            invalidLoginAttempts: true,
            emailVerified: true,
          },
        });

        if (!user) {
          throw new Error("用户不存在");
        }

        if (hasReachedMaxInvalidLoginAttempts(user)) {
          throw new Error("账号已被锁定，请联系管理员");
        }

        const isValid = await validatePassword({
          password,
          passwordHash: user.passwordHash ?? "",
        });

        if (!isValid) {
          await recordInvalidLoginAttempt({ email });
          throw new Error("密码错误");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, //允许按相同邮箱把 Google 登录和已有账号关联起来
    }),
  ],
  // 配置 session token cookie 的名称和安全属性
  cookies: {
    sessionToken: {
      name: SESSION_TOKEN_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  // 自定义认证页面路由，覆盖 NextAuth 默认页面
  // v5 版本功能
  // 未登录用户访问受保护页面时重定向
  // useSession({ required: true }) 触发重定向
  // signIn() 无参数时的默认跳转
  pages: {
    signIn: "/spec/login",
    error: "/spec/login",
  },
  callbacks: {
    // 在 JWT 中持久化登录用户信息，并支持资料更新后刷新 token
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.user = user;
      }

      if (trigger === "update") {
        if (!token.sub) {
          return {};
        }

        const refreshedUser = await prisma.user.findUnique({
          where: {
            id: token.sub,
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        });

        if (refreshedUser) {
          token.user = refreshedUser;
        } else {
          return {};
        }
      }

      return token;
    },
    // 将 JWT 中的用户信息同步到返回给客户端的 session
    session: async ({ session, token }) => {
      // 缺少用户标识时保留 NextAuth 原始 session
      if (!token.sub) {
        return session;
      }

      return {
        ...session,
        user: {
          ...(token.user || session.user),
          id: token.sub,
        },
      };
    },
  },

  // TODO :events 应该需要把三方图片放到自己的对象存储当中
};
