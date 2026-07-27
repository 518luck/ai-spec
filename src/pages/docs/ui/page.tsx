import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { source } from "../model/source";
import { getMDXComponents } from "./mdx-components";

// optional catch-all 路由参数:slug 缺省即文档首页
type DocsRouteParams = { params: Promise<{ slug?: string[] }> };

// # 文档正文页:按 slug 取页渲染 MDX,输出标题、描述与目录
export async function DocsSlugPage({ params }: DocsRouteParams) {
	const { slug } = await params;
	const page = source.getPage(slug);
	if (!page) notFound();
	const Mdx = page.data.body;

	return (
		<DocsPage toc={page.data.toc} full={page.data.full}>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				{/* // 相对链接组件让 .mdx 间的相对路径引用解析为站内路由 */}
				<Mdx components={getMDXComponents({ a: createRelativeLink(source, page) })} />
			</DocsBody>
		</DocsPage>
	);
}

// 静态生成全部文档路径
export const generateDocsStaticParams = () => source.generateParams();

// 页面元数据:标题与描述取自 frontmatter
export async function generateDocsMetadata({ params }: DocsRouteParams): Promise<Metadata> {
	const { slug } = await params;
	const page = source.getPage(slug);
	if (!page) notFound();
	return { title: page.data.title, description: page.data.description };
}
