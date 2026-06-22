import type { NextConfig } from "next";

// 配置项	作用
// headers	    给指定路径的响应批量加响应头（CORS、安全头等）
// redirects	  永久/临时跳转的静态规则（老域名→新域名、HTTP→HTTPS）
// rewrites	    URL 改写（beforeFiles / afterFiles / fallback 三档）
// images	      图片优化域名白名单
// experimental	实验特性开关
// output: 'export' / 'standalone'	    打包模式
// eslint / typescript	                是否在构建时跑 lint / typecheck
const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
