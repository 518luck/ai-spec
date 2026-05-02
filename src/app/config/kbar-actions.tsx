"use client";

import { useRegisterActions } from "kbar";
import { useTheme } from "next-themes";

function useKBarActions() {
  const { resolvedTheme, setTheme } = useTheme();

  const actions = [
    {
      id: "toggle-theme",
      name: "切换主题",
      shortcut: ["t"],
      section: "主题",
      keywords: "theme dark light",
      perform: () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      },
    },
  ];

  useRegisterActions(actions, [resolvedTheme]);
}

export { useKBarActions };
