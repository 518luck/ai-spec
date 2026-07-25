// # 编辑器派生色：从主题 id + 系统明暗算出 CodeMirror 主题对象与背景色
// > 纯函数，供 MarkdownEditor / QuickToolbar / 浮层各自调用；不存状态

import { EDITOR_THEMES } from "../config/editor";

// 派生色结果：CodeMirror theme 对象 + 编辑区背景色 + 工具栏胶囊背景色
type EditorColors = {
	editorTheme: (typeof EDITOR_THEMES)[number]["light"] | (typeof EDITOR_THEMES)[number]["dark"];
	editorBgColor: string;
	toolbarBgColor: string;
};

// > 根据主题 id 与系统明暗派生配色；主题 id 非法（旧版本残留）回退首个
export const resolveEditorColors = (editorThemeId: string, isDark: boolean): EditorColors => {
	const currentTheme = EDITOR_THEMES.find((t) => t.id === editorThemeId) ?? EDITOR_THEMES[0];
	return {
		editorTheme: isDark ? currentTheme.dark : currentTheme.light,
		editorBgColor: isDark ? currentTheme.darkBg : currentTheme.lightBg,
		toolbarBgColor: isDark ? currentTheme.darkToolbarBg : currentTheme.lightToolbarBg,
	};
};
