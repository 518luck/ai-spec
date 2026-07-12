// # 应用基础配置：提供客户端可安全访问的环境变量
export const appConfig = {
	appName: process.env.NEXT_PUBLIC_APP_NAME ?? "AI Spec",
} as const;
