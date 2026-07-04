"use client";

import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from "next-themes";

export function RootThemeProvider({ children, ...props }: ThemeProviderProps) {
	return <NextThemeProvider {...props}>{children}</NextThemeProvider>;
}
