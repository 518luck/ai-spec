// # 全局快捷键位表:所有键位的唯一事实来源,新增或改键只改这里
// ! 每个键位只能有一个绑定所有者:kbar action 带了 shortcut 就禁止再用 useHotkey 绑同键
// ! kbar 的按键排除只查 input/textarea/contenteditable,不覆盖 base-ui 弹窗/菜单——单字母键一律归 useHotkey

// 单条键位:combo 供 useHotkey 绑定,kbarShortcut 供 kbar action 注册,label 供 Kbd 静态展示(mod 组合的跨平台展示用 formatHotkey)
type HotkeyEntry = {
	combo?: string;
	kbarShortcut?: readonly string[];
	label: string;
};

export const HOTKEYS = {
	// @ useHotkey 所有(单字母/符号键,依赖 hook 的焦点排除与模态抑制)
	createNew: { combo: "c", label: "C" }, // 列表页打开创建,各 page.tsx 挂载
	focusSearch: { combo: "/", label: "/" }, // 聚焦当前页搜索框,search-input-field 挂载
	toggleSidebar: { combo: "mod+\\", label: "⌘\\" }, // 折叠/展开侧边栏,dual-sidebar 挂载
	// @ kbar 所有(面板命令与序列键,kbar 自带输入态排除)
	commandPalette: { combo: "mod+k", label: "⌘K" }, // kbar 内建 $mod+k 唤起,无需注册;combo 仅供展示层 formatHotkey 用,不挂 useHotkey
	toggleDarkMode: { kbarShortcut: ["d", "d"], label: "D D" }, // 切换暗/亮模式
	cycleTheme: { kbarShortcut: ["t", "t"], label: "T T" }, // 循环切换色彩主题
	goRecords: { kbarShortcut: ["g", "r"], label: "G R" }, // 导航:收录库
	goDrafts: { kbarShortcut: ["g", "d"], label: "G D" }, // 导航:草稿箱
	goRules: { kbarShortcut: ["g", "g"], label: "G G" }, // 导航:规约库(g 取「规」,r 已被收录占用)
	goAgentsMd: { kbarShortcut: ["g", "a"], label: "G A" }, // 导航:AGENTS.md
	goSettings: { kbarShortcut: ["g", "s"], label: "G S" }, // 导航:设置
} as const satisfies Record<string, HotkeyEntry>;
