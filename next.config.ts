import { createMDX } from "fumadocs-mdx/next";
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
	// 低内存服务器构建优化：单 worker 串行收集 page data + 开启 webpack 内存优化
	// > 仅 production build 生效，不影响本地 dev；2G 内存 VPS 不加会 OOM
	experimental: {
		cpus: 1,
		webpackMemoryOptimizations: true,
	},
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

// fumadocs-mdx:接管 content/docs 的 MDX 编译并生成 .source 目录
const withMDX = createMDX();

export default withMDX(nextConfig);
