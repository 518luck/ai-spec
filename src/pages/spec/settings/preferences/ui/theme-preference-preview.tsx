"use client";

import type { JSX } from "react";

import { THEMES } from "@/shared/configs/theme.config";
import { useActiveTheme } from "@/shared/providers/active-theme-providers";

type ThemeDisc = {
  readonly name: string;
  readonly value: string;
};

type ThemePreferencePreviewProps = {
  readonly title?: string;
  readonly description?: string;
};

// 主题切换卡片
export function ThemePreferencePreview({
  title = "主题外观",
  description = "当系统唤醒浅色模式，此主题就会亮相。",
}: ThemePreferencePreviewProps): JSX.Element {
  const { activeTheme, setActiveTheme } = useActiveTheme();
  const activeThemeName =
    THEMES.find((theme) => theme.value === activeTheme)?.name ?? activeTheme;

  return (
    <section className="bg-card text-card-foreground max-w-sm rounded-lg border shadow-xs">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <ThemePreviewCard activeThemeName={activeThemeName} />

        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Theme picker"
        >
          {THEMES.map((themeDisc) => (
            <ThemeDiscOption
              key={themeDisc.value}
              themeDisc={themeDisc}
              checked={activeTheme === themeDisc.value}
              onSelect={setActiveTheme}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// 预览卡片。
function ThemePreviewCard({
  activeThemeName,
}: {
  readonly activeThemeName: string;
}): JSX.Element {
  return (
    <div className="bg-background overflow-hidden rounded-md border">
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
        <span className="bg-muted text-muted-foreground rounded-full border px-2 py-0.5 text-xs font-medium">
          Preview
        </span>
      </div>
    </div>
  );
}

// 渲染保留原生 radio 语义的圆形主题色盘。
function ThemeDiscOption({
  themeDisc,
  checked,
  onSelect,
}: {
  readonly themeDisc: ThemeDisc;
  readonly checked: boolean;
  readonly onSelect: (theme: string) => void;
}): JSX.Element {
  return (
    <div className="relative">
      <input
        className="peer sr-only"
        id={`theme-${themeDisc.value}`}
        type="radio"
        name="preference-theme-preview"
        value={themeDisc.value}
        aria-label={themeDisc.name}
        checked={checked}
        onChange={() => {
          onSelect(themeDisc.value);
        }}
      />
      <label
        className="bg-muted hover:border-ring peer-checked:border-primary peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition peer-focus-visible:ring-3"
        htmlFor={`theme-${themeDisc.value}`}
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
