import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { skipAuthThrottling } from "@/server/infrastructure/environment";
import { enqueueAvatarSync } from "@/server/infrastructure/queue";
import { ratelimit } from "@/server/infrastructure/redis/reatlimit";
import { appConfig } from "@/shared/configs/app.config";
import prisma from "@/shared/db";
import {
	CALLBACK_URL_COOKIE_NAME,
	CSRF_TOKEN_NAME,
	SESSION_TOKEN_NAME,
} from "@/shared/lib/auth/constants";
import {
	hasReachedMaxInvalidLoginAttempts,
	recordInvalidLoginAttempt,
} from "@/shared/lib/auth/lock-account";
import { validatePassword } from "@/shared/lib/utils";
import { signInDtoSchema } from "@/shared/lib/zod/schemas/auth";
import { isProd } from "./constants";

// # NextAuth 配置中心：session 策略、providers、cookie、callbacks、events
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
			// > 邮箱密码登录验证流程：限流 → 查用户 → 锁定检查 → 密码校验
			authorize: async (credentials) => {
				// ! NextAuth 会自动注入 csrfToken、callbackUrl 等字段，必须先 pick 出 email/password 再交给 schema，否则严格模式会抛 unrecognized_keys
				const { email, password } = signInDtoSchema.parse({
					email: credentials?.email,
					password: credentials?.password,
				});

				// > 没有启用跳过认证限流时，对登录尝试限流（每分钟最多 5 次）
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
			// ! allowDangerousEmailAccountLinking：允许按相同邮箱把 Google 登录和已有账号关联起来
			allowDangerousEmailAccountLinking: true,
			authorization: { params: { prompt: "select_account" } },
		}),
		GitHubProvider({
			clientId: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			// ! allowDangerousEmailAccountLinking：允许按相同邮箱把 GitHub 登录和已有账号关联起来
			allowDangerousEmailAccountLinking: true,
			authorization: { params: { login: "true" } },
		}),
	],
	// 配置本项目专属 cookie 名和安全属性，避免与 localhost 上其他 NextAuth 项目互相覆盖
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
		callbackUrl: {
			name: CALLBACK_URL_COOKIE_NAME,
			options: {
				httpOnly: true,
				sameSite: "lax",
				path: "/",
				secure: isProd,
			},
		},
		csrfToken: {
			name: CSRF_TOKEN_NAME,
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
			// ! 只持久化非敏感字段，避免 passwordHash 等敏感信息泄露到客户端 session
			if (user) {
				token.user = {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
				};
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

	// 第三方登录事件：账号关联成功后入队头像同步任务
	events: {
		// OAuth 账号关联成功后，把第三方头像 URL 加入队列异步处理
		linkAccount: async ({ user }) => {
			if (!user.id || !user.image) {
				return;
			}

			await enqueueAvatarSync({
				userId: user.id,
				imageUrl: user.image,
			});
		},
	},
};
