import { Inter } from "next/font/google";
import { RootThemeProviders } from "@/app/providers/root-theme-providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export function RootLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-full">
        <RootThemeProviders
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
        </RootThemeProviders>
      </body>
    </html>
  );
}
