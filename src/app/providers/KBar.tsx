"use client";

import {
  ActionImpl,
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  useMatches,
} from "kbar";
import { cn } from "@/shared/lib/utils";
import { useKBarActions } from "../config/kbar-actions";

export function KBar({ children }: { children: React.ReactNode }) {
  return (
    <KBarProvider>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}

function KBarComponent({ children }: { children: React.ReactNode }) {
  useKBarActions();
  // /现在搜出来了哪些命令
  const { results } = useMatches();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className="bg-background/70 backdrop-blur-xs">
          <KBarAnimator className="border-border bg-popover text-popover-foreground w-full max-w-2xl overflow-hidden rounded-xl border shadow-2xl">
            <div className="border-border border-b px-3 py-3">
              <KBarSearch
                defaultPlaceholder="输入命令或页面名称..."
                className="border-input text-foreground placeholder:text-muted-foreground h-11 w-full bg-transparent px-3 text-sm outline-none"
              />
            </div>
            <KBarResults
              items={results}
              maxHeight={420}
              onRender={({ item, active }) =>
                typeof item === "string" ? (
                  <div className="text-muted-foreground px-3 py-2 text-xs font-medium tracking-wide uppercase">
                    {item}
                  </div>
                ) : (
                  <ResultItem action={item} active={active} />
                )
              }
            />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
}

function ResultItem({
  action,
  active,
}: {
  action: ActionImpl;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors",
        active ? "bg-accent text-accent-foreground" : "text-popover-foreground",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{action.name}</span>
        {action.subtitle ? (
          <span className="text-muted-foreground truncate text-xs">
            {action.subtitle}
          </span>
        ) : null}
      </div>
      {action.shortcut?.length ? (
        <div className="flex items-center gap-1">
          {action.shortcut.map((key) => (
            <kbd
              key={key}
              className="border-border bg-muted text-muted-foreground rounded-sm border px-1.5 py-0.5 text-[11px] font-medium"
            >
              {key}
            </kbd>
          ))}
        </div>
      ) : null}
    </div>
  );
}
