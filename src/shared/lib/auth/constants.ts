// # 认证模块常量：cookie 命名、有效期、登录方式标识统一定义
// > 生产环境的 cookie 名加 __Secure- / __Host- 前缀，是浏览器强制的安全约束

// 判断认证配置是否运行在生产环境
export const isProd = process.env.NODE_ENV === "production";

// @ Cookie 名称（安全前缀由环境决定）

// ! 生产环境 cookie 名加 __Secure- 前缀，强制要求 https 传输
export const SESSION_TOKEN_NAME = `${isProd ? "__Secure-" : ""}ai-spec.session-token`;

// 登录/退出回跳地址 cookie（生产环境加 __Secure- 前缀）
export const CALLBACK_URL_COOKIE_NAME = `${isProd ? "__Secure-" : ""}ai-spec.callback-url`;

// ! 防 CSRF 令牌 cookie：生产环境用更严格的 __Host- 前缀（禁止子域覆盖、固定 path=/）
export const CSRF_TOKEN_NAME = `${isProd ? "__Host-" : ""}ai-spec.csrf-token`;

// @ 有效期

// 邮箱 OTP 验证码有效期（秒）
export const EMAIL_OTP_EXPIRY_IN = 10 * 60;

// @ 登录方式与字段标识

// Google 登录方式标识
export const AUTH_PROVIDER_GOOGLE = "google" as const;

// 邮箱登录方式标识
export const AUTH_PROVIDER_EMAIL = "email" as const;

// GitHub 登录方式标识
export const AUTH_PROVIDER_GITHUB = "github" as const;

// 密码凭据字段标识
export const AUTH_FIELD_PASSWORD = "password" as const;

// @ 路由

// 登录后跳转地址
export const AUTH_REDIRECT_HOME = "/spec/personal";

// 登录方式联合类型
export type AuthProvider =
	| typeof AUTH_PROVIDER_GOOGLE
	| typeof AUTH_PROVIDER_EMAIL
	| typeof AUTH_PROVIDER_GITHUB;
