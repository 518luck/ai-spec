import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { baseOptions } from "../config/layout-options";
import { source } from "../model/source";
import "./docs.css";

// # 文档站布局:RootProvider 禁用内置主题(复用宿主 next-themes 的 .dark class)+ DocsLayout 侧边栏
export function DocsSiteLayout({ children }: { children: React.ReactNode }) {
	return (
		<RootProvider theme={{ enabled: false }}>
			<DocsLayout tree={source.pageTree} {...baseOptions}>
				{children}
			</DocsLayout>
		</RootProvider>
	);
}
