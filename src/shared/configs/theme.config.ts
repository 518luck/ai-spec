import { getCookie, setCookie } from "@/shared/lib/cookie/client-cookie";
import { COOKIE_DEFAULTS, MODE_THEME_COOKIE_PREFIX } from "@/shared/lib/cookie/cookies";

export const DEFAULT_THEME = "base-vega";

export const THEMES = [
	{
		name: "Base Vega",
		value: "base-vega",
	},
	{
		name: "Doom 64",
		value: "domm64",
	},
];

export type ColorMode = "light" | "dark";

// 按明暗模式持久化色彩主题到 cookie
export const setModeThemeCookie = (mode: ColorMode, theme: string) => {
	if (typeof window === "undefined") return;
	setCookie(`${MODE_THEME_COOKIE_PREFIX}${mode}`, theme, COOKIE_DEFAULTS);
};

// 从 cookie 读取指定明暗模式下保存的色彩主题
export const getModeThemeCookie = (mode: ColorMode): string | undefined => {
	return getCookie(`${MODE_THEME_COOKIE_PREFIX}${mode}`);
};
