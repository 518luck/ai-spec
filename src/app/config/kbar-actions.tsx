"use client";

// # KBar 命令面板 action 注册：主题切换/循环两个命令，快捷键触发

import { useRegisterActions } from "kbar";
import { useTheme } from "next-themes";
import { THEMES } from "@/shared/configs/theme.config";
import { useActiveTheme } from "@/shared/providers/active-theme-providers";

function useKBarActions() {
	const { resolvedTheme, setTheme } = useTheme();
	const { activeTheme, setActiveTheme } = useActiveTheme();

	const cycleTheme = () => {
		const currentIndex = THEMES.findIndex((theme) => theme.value === activeTheme);
		const nextIndex = (currentIndex + 1) % THEMES.length;
		setActiveTheme(THEMES[nextIndex].value);
	};

	// @ 命令定义：id 唯一、shortcut 为两键序列，section 用于面板内分组
	const actions = [
		{
			id: "toggle-light-dark-mode",
			name: "切换暗/亮模式",
			shortcut: ["d", "d"],
			section: "主题",
			keywords: "theme dark light",
			perform: () => {
				setTheme(resolvedTheme === "dark" ? "light" : "dark");
			},
		},
		{
			id: "cycle-theme",
			name: "循环切换主题",
			shortcut: ["t", "t"],
			section: "主题",
			keywords: "theme dark light",
			perform: cycleTheme,
		},
	];

	useRegisterActions(actions, [resolvedTheme, activeTheme]);
}

export { useKBarActions };
