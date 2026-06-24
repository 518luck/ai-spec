"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_THEME } from "../configs/theme.config";

const COOKIE_NAME = "ai-spec.active-theme";

// 设置 cookie
const setThemeCookie = (theme: string) => {
  if (typeof window === "undefined") return;

  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${window.location.protocol === "https:" ? "Secure;" : ""}`;
};

type ThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 这个Provider会从cookie获取默认主题，或者使用initialTheme
export function ActiveThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: string;
}) {
  const themeToUse = initialTheme ?? DEFAULT_THEME;
  const [activeTheme, setActiveTheme] = useState<string>(themeToUse);

  // 同步主题到 <html> 并写入 cookie；首屏值由 SSR 注入，此处仅处理后续切换
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme);
    setThemeCookie(activeTheme);
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 安全的获取上下文
export function useActiveTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeConfig必须在ActiveThemeProvider中使用");
  }
  return context;
}
