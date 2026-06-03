"use client";

import { THEMES } from "@/shared/configs/theme.config";
import { useActiveTheme } from "@/shared/providers/active-theme-providers";
import { useRegisterActions } from "kbar";
import { useTheme } from "next-themes";

function useKBarActions() {
  const { resolvedTheme, setTheme } = useTheme();
  const { activeTheme, setActiveTheme } = useActiveTheme();

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex(
      (theme) => theme.value === activeTheme,
    );
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setActiveTheme(THEMES[nextIndex].value);
  };

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
