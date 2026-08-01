// # Vitest 配置：用 Vite 原生 tsconfig paths 解析 @/* 路径别名

import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		// Vite 原生读取 tsconfig.json 的 paths 配置，无需 vite-tsconfig-paths 插件
		tsconfigPaths: true,
	},
});
