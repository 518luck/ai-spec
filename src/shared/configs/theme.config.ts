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

const MODE_THEME_COOKIE_PREFIX = "mode_theme_";

// 按明暗模式持久化色彩主题到 cookie
export const setModeThemeCookie = (mode: ColorMode, theme: string) => {
	if (typeof window === "undefined") return;

	const name = `${MODE_THEME_COOKIE_PREFIX}${mode}`;
	document.cookie = `${name}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${window.location.protocol === "https:" ? "Secure;" : ""}`;
};

// 从 cookie 读取指定明暗模式下保存的色彩主题
export const getModeThemeCookie = (mode: ColorMode): string | undefined => {
	if (typeof document === "undefined") return undefined;

	const name = `${MODE_THEME_COOKIE_PREFIX}${mode}=`;
	const match = document.cookie.split("; ").find((cookie) => cookie.startsWith(name));

	return match?.slice(name.length);
};
