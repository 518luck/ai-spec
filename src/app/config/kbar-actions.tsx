"use client";

// # KBar 命令面板 action 注册：主题、导航、新建三组命令，键位统一取自 HOTKEYS 常量表

import { useRegisterActions } from "kbar";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { HOTKEYS } from "@/shared/configs/hotkeys.config";
import { THEMES } from "@/shared/configs/theme.config";
import { useActiveTheme } from "@/shared/providers/active-theme-providers";

function useKBarActions() {
	const router = useRouter();
	const { resolvedTheme, setTheme } = useTheme();
	const { activeTheme, setActiveTheme } = useActiveTheme();

	// 按主题列表顺序循环切换色彩主题
	const cycleTheme = () => {
		const currentIndex = THEMES.findIndex((theme) => theme.value === activeTheme);
		const nextIndex = (currentIndex + 1) % THEMES.length;
		setActiveTheme(THEMES[nextIndex].value);
	};

	// ! 模态打开时不导航：kbar 的按键排除不覆盖 base-ui 弹窗，g 序列在工作台弹窗（关闭即保存）内跳走会卸载组件、静默丢失编辑内容
	const navigateUnlessModal = (path: string) => {
		if (document.querySelector('[data-slot="dialog-content"]') !== null) return;
		router.push(path);
	};

	// @ 命令定义：id 唯一、shortcut 从 HOTKEYS 取（readonly 数组展开为可变），section 用于面板内分组
	const actions = [
		// 主题
		{
			id: "toggle-light-dark-mode",
			name: "切换暗/亮模式",
			shortcut: [...HOTKEYS.toggleDarkMode.kbarShortcut],
			section: "主题",
			keywords: "theme dark light",
			perform: () => {
				setTheme(resolvedTheme === "dark" ? "light" : "dark");
			},
		},
		{
			id: "cycle-theme",
			name: "循环切换主题",
			shortcut: [...HOTKEYS.cycleTheme.kbarShortcut],
			section: "主题",
			keywords: "theme dark light",
			perform: cycleTheme,
		},
		// 导航：g 序列两键跳转
		{
			id: "go-records",
			name: "去收录库",
			shortcut: [...HOTKEYS.goRecords.kbarShortcut],
			section: "导航",
			keywords: "records prompt 收录库",
			perform: () => navigateUnlessModal("/spec/personal/prompt/records"),
		},
		{
			id: "go-drafts",
			name: "去草稿箱",
			shortcut: [...HOTKEYS.goDrafts.kbarShortcut],
			section: "导航",
			keywords: "drafts prompt 草稿箱",
			perform: () => navigateUnlessModal("/spec/personal/prompt/drafts"),
		},
		{
			id: "go-rules",
			name: "去规约库",
			shortcut: [...HOTKEYS.goRules.kbarShortcut],
			section: "导航",
			keywords: "rules 规约库",
			perform: () => navigateUnlessModal("/spec/personal/rules"),
		},
		{
			id: "go-agents-md",
			name: "去 AGENTS.md",
			shortcut: [...HOTKEYS.goAgentsMd.kbarShortcut],
			section: "导航",
			keywords: "agents md ai-spec",
			perform: () => navigateUnlessModal("/spec/personal/agents-md"),
		},
		{
			id: "go-settings",
			name: "去设置",
			shortcut: [...HOTKEYS.goSettings.kbarShortcut],
			section: "导航",
			keywords: "settings 设置",
			perform: () => navigateUnlessModal("/spec/settings"),
		},
		// ! 新建组不配 shortcut：C 键由各列表页 useHotkey 绑定，这里带键会双触发
		{
			id: "create-record",
			name: "新建收录",
			section: "新建",
			keywords: "create new record 新建收录",
			perform: () => navigateUnlessModal("/spec/personal/prompt/records?create=1"),
		},
		{
			id: "create-draft",
			name: "新建草稿",
			section: "新建",
			keywords: "create new draft 新建草稿",
			perform: () => navigateUnlessModal("/spec/personal/prompt/drafts?create=1"),
		},
		{
			id: "create-rule",
			name: "新建规约",
			section: "新建",
			keywords: "create new rule 新建规约",
			perform: () => navigateUnlessModal("/spec/personal/rules/create"),
		},
	];

	useRegisterActions(actions, [resolvedTheme, activeTheme, router]);
}

export { useKBarActions };
