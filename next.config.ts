import type { NextConfig } from "next";

// # Next.js 配置

// @ 常用配置项
// - headers：批量响应头
// - redirects：永久/临时跳转
// - rewrites：URL 改写
// - images：图片优化域名白名单
// - experimental：实验特性开关
// - output：打包模式
// - eslint / typescript：构建时是否跑 lint / typecheck

const nextConfig: NextConfig = {
	// 关闭 dev 下的 incoming request 日志，避免与 Axiom 业务日志重复输出
	logging: {
		incomingRequests: false,
	},
	// > 关闭 Next.js Dev Tools，减少 UI 干扰；需要调试时可重新打开
	devIndicators: false,
	// 根路径跳转到个人空间默认页
	async redirects() {
		return [
			{
				source: "/",
				destination: "/spec/personal",
				permanent: false,
			},
		];
	},
};

export default nextConfig;
