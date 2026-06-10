"use client";

import { useTheme } from "next-themes";
import type { JSX } from "react";

import { DEFAULT_THEME } from "@/shared/configs/theme.config";
import { useActiveTheme } from "@/shared/providers/active-theme-providers";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type ThemeMode = "system" | "custom";

const themeModeItems = [
  { label: "系统", value: "system" },
  { label: "自定义", value: "custom" },
];

// 明暗模式切换器，支持系统跟随和手动自定义两种模式
export function ThemeModeSwitcher(): JSX.Element {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { setActiveTheme } = useActiveTheme();

  const currentMode: ThemeMode = theme === "system" ? "system" : "custom";

  const handleModeChange = (value: string | null) => {
    if (!value) return;

    if (value === "system") {
      setTheme("system");
    } else {
      setTheme(resolvedTheme ?? "light");
    }
  };

  const handleReset = () => {
    setTheme("system");
    setActiveTheme(DEFAULT_THEME);
  };

  return (
    <div className="mb-6 flex items-center justify-between">
      <Select items={themeModeItems} value={currentMode} onValueChange={handleModeChange}>
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {themeModeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={handleReset}>
        恢复默认
      </Button>
    </div>
  );
}
