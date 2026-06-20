// 提供客户端安全的应用基础配置
export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "AI Spec",
} as const;
