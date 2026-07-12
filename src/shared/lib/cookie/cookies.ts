// 所有业务 cookie 的集中注册表：名称、值类型、有效期统一管理。
// 调用方只引用常量，不再散落字面量，改名时只需改一处。
// 需要值类型的 cookie，其 interface 紧贴在对应常量上方，一目了然。

// 当前激活的色彩主题。值：主题 value 字符串，如 "base-vega" | "domm64"。
export const ACTIVE_THEME_COOKIE = "ai-spec.active-theme";

// 按明暗模式持久化的色彩主题前缀，实际 cookie 名 = 前缀 + 模式名。
// 示例："mode_theme_light" → "base-vega"，"mode_theme_dark" → "domm64"。
export const MODE_THEME_COOKIE_PREFIX = "mode_theme_";

// 桌面端侧边栏展开/折叠状态。值："true" | "false"。
export const SIDEBAR_STATE_COOKIE = "sidebar_state";

// 双侧边栏拖拽后的宽度。值：像素数字字符串，如 "304"，范围 128–424。
export const SIDEBAR_WIDTH_COOKIE = "sidebar-width";

// 双侧边栏折叠状态。值："true" | "false"。
export const SIDEBAR_COLLAPSED_COOKIE = "sidebar-collapsed";

// 编辑器偏好 cookie 的 JSON 结构
export interface EditorPreferencesCookie {
	// 工具栏启用的操作 id 列表，如 ["bold", "italic"]
	toolbar?: string[];
	// 编辑器视图设置（字号、行高等）
	settings?: Record<string, unknown>;
	// 编辑器主题 id，如 "vscode"
	theme?: string;
}

// 草稿编辑器偏好。值：JSON 字符串，解析后类型为上方 EditorPreferencesCookie。
export const EDITOR_PREFERENCES_COOKIE = "ai-spec.editor-preferences";

// cookie 通用写入选项：1 年有效期、全路径、同源 Lax
export const COOKIE_DEFAULTS = {
	path: "/",
	maxAge: 60 * 60 * 24 * 365, // 一年
	sameSite: "lax",
} as const;

// 侧边栏状态 cookie 特有：仅保留 7 天，避免长期未访问后状态过期突兀
export const SIDEBAR_STATE_COOKIE_OPTIONS = {
	path: "/",
	maxAge: 60 * 60 * 24 * 7, // 7 天
	sameSite: "lax",
} as const;
