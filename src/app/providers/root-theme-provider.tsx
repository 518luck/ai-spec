"use client";

// # 根主题 Provider：对 next-themes 的薄封装，统一对外暴露主题切换能力

import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from "next-themes";

export function RootThemeProvider({ children, ...props }: ThemeProviderProps) {
	return <NextThemeProvider {...props}>{children}</NextThemeProvider>;
}
