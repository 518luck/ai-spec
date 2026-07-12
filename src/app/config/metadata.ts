// # 应用根 metadata：Next.js 自动注入到根布局的 <head>，驱动标题/favicon

import type { Metadata } from "next";
import { appConfig } from "@/shared/configs/app.config";

export const metadata: Metadata = {
	title: appConfig.appName,
	description: "A Next.js App Router starter organized with Feature-Sliced Design.",
	icons: {
		icon: [
			{
				url: "/favicon.svg",
				type: "image/svg+xml",
				sizes: "any",
			},
		],
	},
};
