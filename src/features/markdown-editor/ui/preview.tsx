import type { JSX } from "react";
import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { cn } from "@/shared/lib/utils";

type PreviewProps = {
	// Markdown 源文本
	content: string;
	// 透传到 article 的 className（padding/margin 等布局由调用方决定）
	className?: string;
};

// # Markdown 预览：GFM 语法 + 代码高亮 + 标题锚点；纯渲染，滚动/padding 由调用方决定
export function Preview({ content, className }: PreviewProps): JSX.Element {
	return (
		<article
			className={cn(
				"prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent",
				className,
			)}
		>
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
	);
}
