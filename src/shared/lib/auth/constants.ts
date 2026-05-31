const isProd = process.env.NODE_ENV === "production";

// 生产环境 cookie 名加 __Secure- 前缀
export const SESSION_TOKEN_NAME = `${isProd ? "__Secure-" : ""}next-auth.session-token`;

// 邮箱 OTP 验证码有效期（秒）
export const EMAIL_OTP_EXPIRY_IN = 10 * 60;
