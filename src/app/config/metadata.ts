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
