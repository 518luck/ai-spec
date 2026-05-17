import { RootThemeProvider } from "@/app/providers/root-theme-provider";
import { ActiveThemeProvider } from "@/shared/providers/active-theme-providers";
import { Toaster } from "@/shared/ui/sonner";
import { Oxanium, Source_Code_Pro, Source_Serif_4 } from "next/font/google";

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif-4",
});

export function RootLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    //  - cookie
    // 服务端读取 active_theme
    // loader
    // SSR 首屏注入 data-theme
    // TODO 保证主题首次不闪烁，需要优化(目前用的是ActiveThemeProvider里面useEffect)
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${oxanium.variable} ${sourceCodePro.variable} ${sourceSerif4.variable}`}
    >
      <body className="bg-background text-foreground min-h-full">
        <RootThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {/* TODO 这个地方应该从服务器获取主题然后传递下去暂时不写 */}
          <ActiveThemeProvider>{children}</ActiveThemeProvider>
          <Toaster />
        </RootThemeProvider>
      </body>
    </html>
  );
}
