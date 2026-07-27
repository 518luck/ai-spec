import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

// # 文档站布局公共选项:导航标题与返回应用入口
export const baseOptions: BaseLayoutProps = {
	nav: {
		title: "Prompt Shelf 文档",
	},
	links: [
		{
			text: "返回应用",
			url: "/spec/personal",
		},
	],
};
