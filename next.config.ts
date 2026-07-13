import type { NextConfig } from "next";

// 配置项	作用
// headers	    给指定路径的响应批量加响应头（CORS、安全头等）
// redirects	  永久/临时跳转的静态规则（老域名→新域名、HTTP→HTTPS）
// rewrites	    URL 改写（beforeFiles / afterFiles / fallback 三档）
// images	      图片优化域名白名单
// experimental	实验特性开关
// output: 'export' / 'standalone'	    打包模式
// eslint / typescript	                是否在构建时跑 lint / typecheck
// 根路径跳转到个人空间默认页
const nextConfig: NextConfig = {
	// 关闭 dev 下的 incoming request 日志，避免与 Axiom 业务日志重复输出
	logging: {
		incomingRequests: false,
	},
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
