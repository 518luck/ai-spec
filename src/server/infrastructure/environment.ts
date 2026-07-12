// # 运行环境标识与认证限流开关

export const isProduction = process.env.NODE_ENV === "production";
export const isLocalDev = process.env.NODE_ENV === "development"; //当前是不是本地开发环境
export const isCI = process.env.CI === "true"; //当前是不是持续集成环境，比如自动测试、流水线

// ! 登录接口是否跳过限流：生产环境必须为 false（启用限流防爆破）
// CI / 本地开发为 true（跳过限流，方便测试）
export const skipAuthThrottling = isCI || isLocalDev;
