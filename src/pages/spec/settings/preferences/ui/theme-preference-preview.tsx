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

  // 点击卡片切换明暗模式并恢复该模式保存的色彩主题，带圆形揭示动画
  const handleCardClick = (e: React.MouseEvent) => {
    const root = document.documentElement;

    const apply = () => {
      setColorMode(mode);
      setActiveTheme(localTheme);
    };

    if (!document.startViewTransition) {
      apply();
      return;
    }

    root.style.setProperty("--x", `${e.clientX}px`);
    root.style.setProperty("--y", `${e.clientY}px`);

    document.startViewTransition(apply);
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
  const isDark = mode === "dark";

  const bg = isDark ? "#0f172a" : "#ffffff";
  const fg = isDark ? "#f8fafc" : "#0f172a";
  const card = isDark ? "#1e293b" : "#ffffff";
  const border = isDark ? "#334155" : "#e2e8f0";
  const navBar = isDark ? "#1e293b" : "#f1f5f9";
  const dot = isDark ? "rgba(248,250,252,0.25)" : "rgba(15,23,42,0.25)";
  const placeholder = isDark ? "rgba(248,250,252,0.2)" : "rgba(15,23,42,0.2)";
  const strong = isDark ? "rgba(248,250,252,0.7)" : "rgba(15,23,42,0.7)";
  const sidebar = isDark ? "rgba(30,41,59,0.5)" : "rgba(241,245,249,0.5)";

  return (
    <div
      className="overflow-hidden rounded-md"
      style={{ background: bg, borderColor: border, borderWidth: 1 }}
      data-theme={themeValue}
    >
      <div
        className="flex items-center gap-2 border-b px-3 py-1.5"
        style={{ background: navBar, borderColor: border }}
      >
        <span className="size-2 rounded-full" style={{ background: dot }} />
        <span className="size-2 rounded-full" style={{ background: dot }} />
        <span className="size-2 rounded-full" style={{ background: dot }} />
        <div className="ml-1.5 h-2.5 flex-1 rounded-full" style={{ background: bg }} />
      </div>
      <div className="grid grid-cols-[56px_1fr]">
        <aside
          className="flex flex-col gap-1.5 border-r px-2 py-2.5"
          style={{ background: sidebar, borderColor: border }}
        >
          <div className="h-2 w-8 rounded-full" style={{ background: strong }} />
          <div className="h-2 w-10 rounded-full" style={{ background: placeholder }} />
          <div className="h-2 w-6 rounded-full" style={{ background: placeholder }} />
          <div className="h-2 w-6 rounded-full" style={{ background: placeholder }} />
        </aside>
        <main className="flex flex-col gap-2 p-2.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded-full" style={{ background: strong }} />
            <div className="h-2 w-20 rounded-full" style={{ background: placeholder }} />
          </div>
          <div className="flex gap-2">
            <div
              className="h-8 flex-1 rounded-sm"
              style={{ background: card, borderColor: border, borderWidth: 1 }}
            />
            <div
              className="h-8 flex-1 rounded-sm"
              style={{ background: card, borderColor: border, borderWidth: 1 }}
            />
          </div>
          <div className="flex gap-2">
            <div
              className="h-10 flex-1 rounded-sm"
              style={{ background: card, borderColor: border, borderWidth: 1 }}
            />
          </div>
        </main>
      </div>
      <div
        className="flex items-center justify-between gap-3 border-t px-4 py-2"
        style={{ borderColor: border }}
      >
        <div>
          <span className="sr-only">Selected theme: </span>
          <p className="text-sm font-semibold" style={{ color: fg }}>
            {activeThemeName}
          </p>
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
