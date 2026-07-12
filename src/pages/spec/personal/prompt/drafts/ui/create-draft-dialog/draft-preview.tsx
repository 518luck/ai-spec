import type { JSX } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type DraftPreviewProps = {
	// Markdown 源文本
	content: string;
};

// Markdown 预览：用 react-markdown + remark-gfm 渲染，支持 GFM 表格、删除线、任务列表
export function DraftPreview({ content }: DraftPreviewProps): JSX.Element {
	console.log("🚀 ~ DraftPreview ~ content:", content);
	return (
		<article className="prose prose-sm dark:prose-invert max-w-none p-4 pt-12">
			<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
		</article>
	);
}
