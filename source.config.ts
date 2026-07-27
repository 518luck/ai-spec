import { defineConfig, defineDocs } from "fumadocs-mdx/config";

// # Fumadocs 内容集合定义:content/docs 编译为类型安全的 .source 生成物

export const docs = defineDocs({
	dir: "content/docs",
	docs: {
		// 保留每页处理后的 markdown 文本,为 llms.txt / 每页 .md 导出等 AI 能力预留
		postprocess: { includeProcessedMarkdown: true },
	},
});

export default defineConfig();
