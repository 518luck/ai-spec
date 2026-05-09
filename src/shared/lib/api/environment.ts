export const isProduction = process.env.NODE_ENV === "production";
export const isLocalDev = process.env.NODE_ENV === "development"; //当前是不是本地开发环境
export const isCI = process.env.CI === "true"; //当前是不是持续集成环境，比如自动测试、流水线

// 登录接口是否需要防止暴力破解（加验证码）
// 生产环境/CI测试环境用 false（即需要验证码）
// 本地开发环境用 true（即跳过验证码，方便开发测试）
export const skipAuthThrottling = isCI || isLocalDev;
