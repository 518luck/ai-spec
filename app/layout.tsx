import { metadata } from "@/app/config/metadata";
import { RootLayoutShell } from "@/app/layouts/root-layout-shell";
import "@/app/styles/global.css";

export { metadata };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootLayoutShell>{children}</RootLayoutShell>;
}
