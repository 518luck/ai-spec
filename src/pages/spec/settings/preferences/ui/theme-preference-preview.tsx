"use client";

import { useTheme } from "next-themes";
import type { JSX, ReactNode } from "react";
import { useState } from "react";

import {
  type ColorMode,
  DEFAULT_THEME,
  THEMES,
  getModeThemeCookie,
  setModeThemeCookie,
} from "@/shared/configs/theme.config";
import { cn } from "@/shared/lib/utils";
import { useActiveTheme } from "@/shared/providers/active-theme-providers";
import { Badge } from "@/shared/ui/badge";

type ThemeDisc = {
  readonly name: string;
  readonly value: string;
};

type ThemePreferencePreviewProps = {
  readonly title?: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly mode: ColorMode;
};

// 按明暗模式管理色彩主题，点击卡片切换明暗，色盘仅切换色彩
export function ThemePreferencePreview({
  title = "主题外观",
  description = "当系统唤醒浅色模式，此主题就会亮相。",
  icon,
  mode,
}: ThemePreferencePreviewProps): JSX.Element {
  const { setTheme: setColorMode, resolvedTheme } = useTheme();
  const { activeTheme, setActiveTheme } = useActiveTheme();

  const isCurrentMode = resolvedTheme === mode;
  const [localTheme, setLocalTheme] = useState<string>(
    () => getModeThemeCookie(mode) ?? DEFAULT_THEME,
  );

  const displayedTheme = isCurrentMode ? activeTheme : localTheme;
  const displayedThemeName =
    THEMES.find((t) => t.value === displayedTheme)?.name ?? displayedTheme;

  // 点击卡片切换明暗模式并恢复该模式保存的色彩主题
  const handleCardClick = () => {
    setColorMode(mode);
    setActiveTheme(localTheme);
  };

  // 色盘点击仅切换色彩主题，不切换明暗
  const handleSelect = (themeValue: string) => {
    setLocalTheme(themeValue);
    setModeThemeCookie(mode, themeValue);
    setActiveTheme(themeValue);
  };

  return (
    <section
      className={cn(
        "cursor-pointer rounded-lg shadow-xs transition",
        isCurrentMode
          ? "border-primary/50 bg-primary/5 text-card-foreground border"
          : "bg-card text-card-foreground border",
      )}
      onClick={handleCardClick}
    >
      <div
        className={cn(
          "px-5 py-4",
          isCurrentMode
            ? "bg-primary/5 border-primary/20 border-b"
            : "border-b",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          {isCurrentMode && <Badge variant="secondary">使用中</Badge>}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <ThemePreviewCard
          activeThemeName={displayedThemeName}
          mode={mode}
          themeValue={displayedTheme}
        />

        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Theme picker"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {THEMES.map((themeDisc) => (
            <ThemeDiscOption
              key={themeDisc.value}
              themeDisc={themeDisc}
              checked={isCurrentMode && activeTheme === themeDisc.value}
              onSelect={handleSelect}
              mode={mode}
              disabled={!isCurrentMode}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// 预览卡片，根据 mode 强制渲染对应的明暗风格。
function ThemePreviewCard({
  activeThemeName,
  mode,
  themeValue,
}: {
  readonly activeThemeName: string;
  readonly mode: ColorMode;
  readonly themeValue: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border",
        mode === "dark" && "dark",
      )}
      data-theme={themeValue}
    >
      <div className="bg-muted/30 flex items-center gap-2 border-b px-3 py-1.5">
        <span className="bg-muted-foreground/25 size-2 rounded-full" />
        <span className="bg-muted-foreground/25 size-2 rounded-full" />
        <span className="bg-muted-foreground/25 size-2 rounded-full" />
        <div className="bg-background ml-1.5 h-2.5 flex-1 rounded-full" />
      </div>
      <div className="grid grid-cols-[56px_1fr]">
        <aside className="bg-muted/35 flex flex-col gap-1.5 border-r px-2 py-2.5">
          <div className="bg-foreground/70 h-2 w-8 rounded-full" />
          <div className="bg-muted-foreground/20 h-2 w-10 rounded-full" />
          <div className="bg-muted-foreground/20 h-2 w-6 rounded-full" />
          <div className="bg-muted-foreground/20 h-2 w-6 rounded-full" />
        </aside>
        <main className="flex flex-col gap-2 p-2.5">
          <div className="flex items-center gap-2">
            <div className="bg-foreground/70 h-2 w-16 rounded-full" />
            <div className="bg-muted-foreground/20 h-2 w-20 rounded-full" />
          </div>
          <div className="flex gap-2">
            <div className="bg-card h-8 flex-1 rounded-sm border" />
            <div className="bg-card h-8 flex-1 rounded-sm border" />
          </div>
          <div className="flex gap-2">
            <div className="bg-card h-10 flex-1 rounded-sm border" />
          </div>
        </main>
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-2">
        <div>
          <span className="sr-only">Selected theme: </span>
          <p className="text-sm font-semibold">{activeThemeName}</p>
        </div>
      </div>
    </div>
  );
}

// 渲染保留原生 radio 语义的圆形主题色盘。
function ThemeDiscOption({
  themeDisc,
  checked,
  onSelect,
  mode,
  disabled,
}: {
  readonly themeDisc: ThemeDisc;
  readonly checked: boolean;
  readonly onSelect: (theme: string) => void;
  readonly mode: ColorMode;
  readonly disabled: boolean;
}): JSX.Element {
  return (
    <div className="relative">
      <input
        className="peer sr-only"
        id={`theme-${mode}-${themeDisc.value}`}
        type="radio"
        name={`preference-theme-preview-${mode}`}
        value={themeDisc.value}
        aria-label={themeDisc.name}
        checked={checked}
        disabled={disabled}
        onChange={() => {
          onSelect(themeDisc.value);
        }}
      />
      <label
        className={cn(
          "bg-muted flex size-10 items-center justify-center rounded-full border-2 border-transparent transition",
          disabled
            ? "opacity-50"
            : "hover:border-ring peer-checked:border-primary peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 cursor-pointer peer-focus-visible:ring-3",
        )}
        htmlFor={`theme-${mode}-${themeDisc.value}`}
        title={themeDisc.name}
      >
        <span
          className="bg-background flex size-8 items-center justify-center overflow-hidden rounded-full border"
          data-theme={themeDisc.value}
        >
          <span className="bg-background grid size-full grid-cols-2 grid-rows-2 rounded-full">
            <span className="bg-background" />
            <span className="bg-card" />
            <span className="bg-muted" />
            <span className="bg-primary" />
          </span>
        </span>
      </label>
    </div>
  );
}
