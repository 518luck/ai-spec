import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

// # MDX 组件表:文档正文可用的组件集合,后续定制(如 Callout/Cards 扩展)统一收口在这里
export const getMDXComponents = (components?: MDXComponents): MDXComponents => ({
	...defaultMdxComponents,
	...components,
});
