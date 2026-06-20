// 判断认证配置是否运行在生产环境
export const isProd = process.env.NODE_ENV === "production";

// 生产环境 cookie 名加 __Secure- 前缀
export const SESSION_TOKEN_NAME = `${isProd ? "__Secure-" : ""}ai-spec.session-token`;

// 登录/退出回跳地址 cookie（生产环境加 __Secure- 前缀）
export const CALLBACK_URL_COOKIE_NAME = `${isProd ? "__Secure-" : ""}ai-spec.callback-url`;

// 防 CSRF 令牌 cookie（生产环境用更严格的 __Host- 前缀，与 @auth/core 默认一致）
export const CSRF_TOKEN_NAME = `${isProd ? "__Host-" : ""}ai-spec.csrf-token`;

// 邮箱 OTP 验证码有效期（秒）
export const EMAIL_OTP_EXPIRY_IN = 10 * 60;

// Google 登录方式标识
export const AUTH_PROVIDER_GOOGLE = "google" as const;

// 邮箱登录方式标识
export const AUTH_PROVIDER_EMAIL = "email" as const;

// GitHub 登录方式标识
export const AUTH_PROVIDER_GITHUB = "github" as const;

// 密码凭据字段标识
export const AUTH_FIELD_PASSWORD = "password" as const;

// 登录后跳转地址
export const AUTH_REDIRECT_HOME = "/spec/personal";

// 登录方式联合类型
export type AuthProvider =
  | typeof AUTH_PROVIDER_GOOGLE
  | typeof AUTH_PROVIDER_EMAIL
  | typeof AUTH_PROVIDER_GITHUB;
