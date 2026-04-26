import { AppProviders } from "@/app/providers";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

type RootLayoutShellProps = Readonly<{
  children: React.ReactNode;
}>;

export function RootLayoutShell({ children }: RootLayoutShellProps) {
  return (
    <html lang="zh-CN" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-background text-foreground min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
