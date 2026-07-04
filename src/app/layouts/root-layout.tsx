import { Oxanium, Source_Code_Pro, Source_Serif_4 } from "next/font/google";
import { cookies } from "next/headers";
import { SessionProvider } from "next-auth/react";
import { RootThemeProvider } from "@/app/providers/root-theme-provider";
import { DEFAULT_THEME } from "@/shared/configs/theme.config";
import { ActiveThemeProvider } from "@/shared/providers/active-theme-providers";
import { Toaster } from "@/shared/ui/sonner";

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

const ACTIVE_THEME_COOKIE = "ai-spec.active-theme";

// 根布局外壳：SSR 注入主题，保证首屏即带 data-theme，避免主题闪烁与恢复丢失
export async function RootLayoutShell({ children }: { children: React.ReactNode }) {
	// 服务端读取用户主题偏好，缺失时回退默认主题
	const cookieStore = await cookies();
	const activeTheme = cookieStore.get(ACTIVE_THEME_COOKIE)?.value ?? DEFAULT_THEME;

	return (
		<html
			lang="zh-CN"
			data-theme={activeTheme}
			suppressHydrationWarning
			className={`${oxanium.variable} ${sourceCodePro.variable} ${sourceSerif4.variable}`}
		>
			<body className="min-h-full bg-background text-foreground">
				<RootThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
					enableColorScheme
				>
					<SessionProvider>
						{/* initialTheme 与 SSR 注入值同源，避免挂载时覆盖正确主题 */}
						<ActiveThemeProvider initialTheme={activeTheme}>{children}</ActiveThemeProvider>
					</SessionProvider>
					<Toaster />
				</RootThemeProvider>
			</body>
		</html>
	);
}
