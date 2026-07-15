import type { JSX } from "react";
import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { ScrollArea } from "@/shared/ui/scroll-area";

type MarkdownPreviewProps = {
	// Markdown 源文本
	content: string;
	// 预览区域高度：与弹窗 motion.div 的 height 一致（减去导航栏 h-12 = 3rem）
	height: string;
};

// # Markdown 预览：GFM 语法 + 代码高亮 + 标题锚点
export function MarkdownPreview({ content, height }: MarkdownPreviewProps): JSX.Element {
	return (
		<ScrollArea style={{ height, maxHeight: height }}>
			<article className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent p-4 pt-12">
				{/*
					rehype 插件链顺序：slug 生成 id → autolink 给标题加锚点链接
					→ external-links 外链新窗口打开 → highlight 代码高亮
				*/}
				<Markdown
					remarkPlugins={[remarkGfm]}
					rehypePlugins={[
						rehypeSlug, // 为标题生成 id 锚点（保留，供将来目录/分享定位用）
						[rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }], // 外链新窗口打开
						rehypeHighlight, // 代码块语法高亮
					]}
				>
					{content}
				</Markdown>
			</article>
		</ScrollArea>
	);
}
