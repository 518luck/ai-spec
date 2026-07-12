import type { JSX } from "react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { ScrollArea } from "@/shared/ui/scroll-area";

type DraftPreviewProps = {
	// Markdown 源文本
	content: string;
	// 预览区域高度：与弹窗 motion.div 的 height 一致（减去导航栏 h-12 = 3rem）
	height: string;
};

// Markdown 预览：GFM 语法 + 代码高亮 + 标题锚点
export function DraftPreview({ content, height }: DraftPreviewProps): JSX.Element {
	return (
		<ScrollArea style={{ height, maxHeight: height }}>
			<article className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent p-4 pt-12">
				<Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]}>
					{content}
				</Markdown>
			</article>
		</ScrollArea>
	);
}
