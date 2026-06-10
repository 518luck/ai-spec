import { appConfig } from "@/shared/configs/app.config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: appConfig.appName,
  description:
    "A Next.js App Router starter organized with Feature-Sliced Design.",
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
