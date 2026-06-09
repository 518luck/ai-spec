import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";

type ThemeDisc = {
  readonly id: string;
  readonly name: string;
  readonly previewClassName: string;
  readonly selected?: boolean;
};

const themeDiscs: readonly ThemeDisc[] = [
  {
    id: "light-default",
    name: "Light default",
    previewClassName:
      "bg-[conic-gradient(from_180deg,#ffffff_0_32%,#f6f8fa_32%_66%,#0969da_66%_100%)]",
    selected: true,
  },
  {
    id: "light-colorblind",
    name: "Light protanopia and deuteranopia",
    previewClassName:
      "bg-[conic-gradient(from_180deg,#ffffff_0_32%,#f0f3f6_32%_66%,#8250df_66%_100%)]",
  },
  {
    id: "light-tritanopia",
    name: "Light tritanopia",
    previewClassName:
      "bg-[conic-gradient(from_180deg,#ffffff_0_32%,#f6f8fa_32%_66%,#bf8700_66%_100%)]",
  },
  {
    id: "dark-default",
    name: "Dark default",
    previewClassName:
      "bg-[conic-gradient(from_180deg,#0d1117_0_32%,#161b22_32%_66%,#2f81f7_66%_100%)]",
  },
  {
    id: "dark-colorblind",
    name: "Dark protanopia and deuteranopia",
    previewClassName:
      "bg-[conic-gradient(from_180deg,#0d1117_0_32%,#161b22_32%_66%,#a371f7_66%_100%)]",
  },
  {
    id: "dark-tritanopia",
    name: "Dark tritanopia",
    previewClassName:
      "bg-[conic-gradient(from_180deg,#0d1117_0_32%,#161b22_32%_66%,#d29922_66%_100%)]",
  },
  {
    id: "dark-dimmed",
    name: "Soft dark",
    previewClassName:
      "bg-[conic-gradient(from_180deg,#22272e_0_32%,#2d333b_32%_66%,#539bf5_66%_100%)]",
  },
];

// 展示类似 GitHub 外观设置的主题预览与色盘选择样式。
export function ThemePreferencePreview(): JSX.Element {
  return (
    <section className="bg-card text-card-foreground max-w-xl rounded-lg border shadow-xs">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold">主题外观</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          This theme will be active when your system is set to light mode
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <ThemePreviewCard />

        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Light theme picker"
        >
          {themeDiscs.map((themeDisc) => (
            <ThemeDiscOption key={themeDisc.id} themeDisc={themeDisc} />
          ))}
        </div>
      </div>
    </section>
  );
}

// 绘制当前选中主题的大尺寸静态预览卡片。
function ThemePreviewCard(): JSX.Element {
  return (
    <div className="bg-background overflow-hidden rounded-md border">
      <div className="bg-muted/40 border-b p-3">
        <div className="bg-card overflow-hidden rounded-md border shadow-xs">
          <div className="bg-muted/30 flex items-center gap-2 border-b px-3 py-2">
            <span className="bg-muted-foreground/25 size-2.5 rounded-full" />
            <span className="bg-muted-foreground/25 size-2.5 rounded-full" />
            <span className="bg-muted-foreground/25 size-2.5 rounded-full" />
            <div className="bg-background ml-2 h-3 flex-1 rounded-full" />
          </div>

          <div className="bg-background grid grid-cols-[92px_1fr]">
            <aside className="bg-muted/35 flex flex-col gap-2 border-r p-3">
              <div className="bg-foreground/80 h-3 w-12 rounded-full" />
              <div className="bg-muted-foreground/25 h-2.5 w-16 rounded-full" />
              <div className="bg-muted-foreground/25 h-2.5 w-14 rounded-full" />
              <div className="bg-card mt-2 h-7 rounded-md border" />
              <div className="bg-primary/12 h-7 rounded-md" />
              <div className="bg-card h-7 rounded-md" />
            </aside>

            <main className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="bg-foreground/80 h-3 w-28 rounded-full" />
                  <div className="bg-muted-foreground/25 h-2.5 w-40 rounded-full" />
                </div>
                <div className="bg-primary h-7 w-16 rounded-md" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card h-14 rounded-md border" />
                <div className="bg-card h-14 rounded-md border" />
                <div className="bg-card h-14 rounded-md border" />
              </div>

              <div className="bg-card rounded-md border p-3">
                <div className="bg-foreground/75 mb-3 h-3 w-24 rounded-full" />
                <div className="flex flex-col gap-2">
                  <div className="bg-muted h-2.5 rounded-full" />
                  <div className="bg-muted h-2.5 w-5/6 rounded-full" />
                  <div className="bg-muted h-2.5 w-2/3 rounded-full" />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <span className="sr-only">Selected theme: </span>
          <p className="text-sm font-semibold">Light default</p>
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
}: {
  readonly themeDisc: ThemeDisc;
}): JSX.Element {
  return (
    <div className="relative">
      <input
        className="peer sr-only"
        id={`theme-${themeDisc.id}`}
        type="radio"
        name="preference-theme-preview"
        value={themeDisc.id}
        aria-label={themeDisc.name}
        defaultChecked={themeDisc.selected}
      />
      <label
        className="bg-muted hover:border-ring peer-checked:border-primary peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition peer-focus-visible:ring-3"
        htmlFor={`theme-${themeDisc.id}`}
        title={themeDisc.name}
      >
        <span className="bg-background flex size-8 items-center justify-center overflow-hidden rounded-full border">
          <span
            className={cn("size-full rounded-full", themeDisc.previewClassName)}
          />
        </span>
      </label>
    </div>
  );
}
