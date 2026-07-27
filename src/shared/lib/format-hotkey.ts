// # 快捷键展示格式化:把 "mod+b" 这类绑定 token 翻译成当前平台的符号(⌘B / Ctrl+B)

// 当前是否 mac 系平台;SSR 时无 navigator 按非 mac 处理,调用方应只在交互后才渲染的 UI(tooltip/弹窗)中使用,避免水合不一致
export const isMacPlatform = (): boolean =>
	typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

// mac 下修饰键/特殊键的展示符号
const MAC_SYMBOLS: Record<string, string> = {
	mod: "⌘",
	alt: "⌥",
	shift: "⇧",
	enter: "↵",
};

// 非 mac 平台的展示文字
const PC_LABELS: Record<string, string> = {
	mod: "Ctrl",
	alt: "Alt",
	shift: "Shift",
	enter: "Enter",
};

// 把 "mod+shift+9" 翻译为 "⌘⇧9"(mac)或 "Ctrl+Shift+9"(其余平台)
export const formatHotkey = (combo: string): string => {
	const isMac = isMacPlatform();
	const symbols = isMac ? MAC_SYMBOLS : PC_LABELS;
	const parts = combo.split("+").map((part) => symbols[part] ?? part.toUpperCase());
	return parts.join(isMac ? "" : "+");
};
