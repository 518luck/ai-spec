// # 编辑器配置 —— 主题、菜单分组、格式化操作的集中定义

import { type EditorView, keymap } from "@codemirror/view";
import { basicDark, basicLight } from "@uiw/codemirror-theme-basic";
import { duotoneDark, duotoneLight } from "@uiw/codemirror-theme-duotone";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { materialDark, materialLight } from "@uiw/codemirror-theme-material";
import { solarizedDark, solarizedLight } from "@uiw/codemirror-theme-solarized";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { xcodeDark, xcodeLight } from "@uiw/codemirror-theme-xcode";

// ! Prec 从 @uiw/react-codemirror 的再导出取：@codemirror/state 非直接依赖，pnpm 隔离链接下无法从 src 解析
import { Prec, type ReactCodeMirrorRef } from "@uiw/react-codemirror";

import type { Icon } from "@/shared/ui/icons";
import { Icons } from "@/shared/ui/icons";

// @ 语法映射

// Lezer Markdown 节点名 → 工具 id 的映射，用于判断光标位置处于什么格式内
export const NODE_NAME_TO_TOOL_ID: Record<string, ToolId> = {
	StrongEmphasis: "bold",
	Emphasis: "italic",
	ATXHeading: "heading1",
	Blockquote: "quote",
	FencedCode: "code",
	Link: "link",
};

// @ 编辑器主题

// 每个主题提供亮色/暗色变体及背景色，跟随应用 resolvedTheme 切换
export const EDITOR_THEMES = [
	{
		id: "github",
		label: "GitHub",
		light: githubLight,
		dark: githubDark,
		lightBg: "#ffffff",
		darkBg: "#0d1117",
		lightToolbarBg: "#e8e8e8",
		darkToolbarBg: "#21262d",
	},
	{
		id: "vscode",
		label: "VS Code",
		light: vscodeLight,
		dark: vscodeDark,
		lightBg: "#ffffff",
		darkBg: "#1e1e1e",
		lightToolbarBg: "#e8e8e8",
		darkToolbarBg: "#2d2d2d",
	},
	{
		id: "xcode",
		label: "Xcode",
		light: xcodeLight,
		dark: xcodeDark,
		lightBg: "#ffffff",
		darkBg: "#292A30",
		lightToolbarBg: "#e8e8e8",
		darkToolbarBg: "#3a3b3f",
	},
	{
		id: "material",
		label: "Material",
		light: materialLight,
		dark: materialDark,
		lightBg: "#FAFAFA",
		darkBg: "#2e3235",
		lightToolbarBg: "#ececec",
		darkToolbarBg: "#3a3f44",
	},
	{
		id: "solarized",
		label: "Solarized",
		light: solarizedLight,
		dark: solarizedDark,
		lightBg: "#FDF6E3",
		darkBg: "#002B36",
		lightToolbarBg: "#eee8d5",
		darkToolbarBg: "#073642",
	},
	{
		id: "duotone",
		label: "Duotone",
		light: duotoneLight,
		dark: duotoneDark,
		lightBg: "#faf8f5",
		darkBg: "#2a2734",
		lightToolbarBg: "#ede9e0",
		darkToolbarBg: "#363342",
	},
	{
		id: "basic",
		label: "Basic",
		light: basicLight,
		dark: basicDark,
		lightBg: "#ffffff",
		darkBg: "#2E3235",
		lightToolbarBg: "#e8e8e8",
		darkToolbarBg: "#3a3f44",
	},
] as const;

// @ 菜单项与分组

// 菜单项类型
export type MenuItem = {
	id: string;
	label: string;
	icon: Icon;
	description?: string;
	/** 快捷键绑定 token（如 "mod+b"）：formatKeymap 据此生成绑定，Tooltip 经 formatHotkey 展示 */
	shortcut?: string;
	/** 该项在哪种模式下显示：edit（编辑模式）、preview（预览模式）、both（两种模式，默认） */
	showIn?: "edit" | "preview" | "both";
};

// 快捷操作工具 id 联合类型：MENU_GROUPS 和 executeFormat 共同受此约束，防止拼写不一致
export const TOOL_IDS = ["bold", "italic", "heading1", "quote", "code", "link"] as const;
export type ToolId = (typeof TOOL_IDS)[number];

// 菜单分组类型：type 决定点击文字时的行为（tool=格式工具 / display=显示设置 / preview=视图切换）
export type MenuGroup = {
	type: "tool" | "display" | "preview";
	items: readonly MenuItem[];
};

// 菜单分组：type 决定点击文字时的行为（tool=格式工具 / display=显示设置 / preview=视图切换）
export const MENU_GROUPS: readonly MenuGroup[] = [
	{
		type: "tool",
		items: [
			{ id: "bold", label: "加粗", icon: Icons.bold, shortcut: "mod+b", showIn: "edit" },
			{ id: "italic", label: "斜体", icon: Icons.italic, shortcut: "mod+i", showIn: "edit" },
			{
				id: "heading1",
				label: "标题",
				icon: Icons.heading1,
				shortcut: "mod+alt+1",
				showIn: "edit",
			},
			{ id: "quote", label: "引用", icon: Icons.quote, shortcut: "mod+shift+9", showIn: "edit" },
			{ id: "code", label: "代码", icon: Icons.code, shortcut: "mod+e", showIn: "edit" },
			{ id: "link", label: "链接", icon: Icons.link, shortcut: "mod+k", showIn: "edit" },
		],
	},
	{
		type: "display",
		items: [
			{
				id: "lineNumbers",
				label: "行号",
				icon: Icons.lineNumbers,
				description: "在编辑器左侧显示行号编号",
				showIn: "edit",
			},
			{
				id: "foldGutter",
				label: "折叠",
				icon: Icons.fold,
				description: "收起或展开代码区块",
				showIn: "edit",
			},
			{
				id: "highlightActiveLine",
				label: "高亮",
				icon: Icons.highlight,
				description: "高亮显示光标所在行",
				showIn: "edit",
			},
		],
	},
	{
		type: "preview",
		items: [
			{
				id: "preview",
				label: "预览",
				icon: Icons.eyeSearch,
				description: "切换到 Markdown 渲染预览模式",
				showIn: "edit",
			},
			{
				id: "source",
				label: "源码",
				icon: Icons.eyeCode,
				description: "返回 Markdown 源码编辑模式",
				showIn: "preview",
			},
		],
	},
];

// 编辑器视图设置默认值
export const defaultEditorSettings = {
	lineNumbers: false,
	foldGutter: false,
	highlightActiveLine: false,
};

// @ Markdown 格式化操作

// 在选区两端包裹格式标记的核心实现，直接操作 EditorView（供菜单包装函数与快捷键 keymap 共用）
const wrapSelectionInView = (view: EditorView, before: string, after = before): void => {
	const { from, to } = view.state.selection.main;
	view.dispatch({
		changes: { from, to, insert: before + view.state.sliceDoc(from, to) + after },
		selection: { anchor: from + before.length, head: to + before.length },
	});
	view.focus();
};

// 在行首添加 Markdown 前缀的核心实现，直接操作 EditorView
const prependLineInView = (view: EditorView, prefix: string): void => {
	const { from } = view.state.selection.main;
	const line = view.state.doc.lineAt(from);
	view.dispatch({
		changes: { from: line.from, insert: prefix },
	});
	view.focus();
};

// 执行某个工具 id 对应格式化操作的核心实现，直接操作 EditorView
const executeFormatInView = (view: EditorView, id: ToolId): void => {
	switch (id) {
		case "bold":
			wrapSelectionInView(view, "**");
			break;
		case "italic":
			wrapSelectionInView(view, "*");
			break;
		case "code":
			wrapSelectionInView(view, "`");
			break;
		case "link":
			wrapSelectionInView(view, "[", "](url)");
			break;
		case "heading1":
			prependLineInView(view, "# ");
			break;
		case "quote":
			prependLineInView(view, "> ");
			break;
	}
};

// > 在选区两端包裹格式标记（如 **粗体**），无选区时插入空标记并光标居中
export const wrapSelection = (
	view: ReactCodeMirrorRef | null,
	before: string,
	after = before,
): void => {
	const v = view?.view;
	if (!v) return;
	wrapSelectionInView(v, before, after);
};

// 在行首添加 Markdown 前缀（如 # 标题、> 引用）
export const prependLine = (view: ReactCodeMirrorRef | null, prefix: string): void => {
	const v = view?.view;
	if (!v) return;
	prependLineInView(v, prefix);
};

// 执行某个工具 id 对应的格式化操作
export const executeFormat = (view: ReactCodeMirrorRef | null, id: ToolId): void => {
	const v = view?.view;
	if (!v) return;
	executeFormatInView(v, id);
};

// @ 格式化快捷键 keymap

// 把 "mod+alt+1" 绑定 token 转成 CodeMirror 键名 "Mod-Alt-1"：修饰键首字母大写，末位主键保持原样
const toCodeMirrorKey = (combo: string): string =>
	combo
		.split("+")
		.map((part, index, parts) =>
			index === parts.length - 1 ? part : part.charAt(0).toUpperCase() + part.slice(1),
		)
		.join("-");

// 收窄 string → ToolId 的类型守卫（菜单项 id 是宽泛 string）
const isToolId = (id: string): id is ToolId => TOOL_IDS.some((toolId) => toolId === id);

// > 编辑器格式化快捷键：从 tool 组的 shortcut token 生成绑定，键位与 Tooltip 展示同源
// > 命中后 return true 自动 preventDefault，压过 kbar 的 ⌘K 与浏览器默认行为
export const formatKeymap = Prec.high(
	keymap.of(
		MENU_GROUPS.filter((group) => group.type === "tool")
			.flatMap((group) => group.items)
			.flatMap(({ id, shortcut }) =>
				shortcut && isToolId(id)
					? [
							{
								key: toCodeMirrorKey(shortcut),
								run: (view: EditorView): boolean => {
									executeFormatInView(view, id);
									return true;
								},
							},
						]
					: [],
			),
	),
);
