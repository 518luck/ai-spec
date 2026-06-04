import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { DualSidebarProvider } from "../model/dual-sidebar-context";

type DualSidebarLayoutProps = ComponentProps<"div"> & {
  sidebar: ReactNode;
  sidebarClassName?: string;
  contentClassName?: string;
  defaultSidebarOpen?: boolean;
};

// 承载左侧双侧边栏和右侧主内容区的应用级布局。
export function DualSidebarLayout({
  className,
  sidebar,
  sidebarClassName,
  contentClassName,
  defaultSidebarOpen,
  children,
  ...props
}: DualSidebarLayoutProps): JSX.Element {
  return (
    <DualSidebarProvider defaultOpen={defaultSidebarOpen}>
      <div
        data-slot="dual-sidebar-layout"
        className={cn(
          "bg-background text-foreground flex min-h-dvh w-full overflow-hidden",
          className,
        )}
        {...props}
      >
        <aside
          data-slot="dual-sidebar-layout-sidebar"
          className={cn(
            "bg-sidebar text-sidebar-foreground flex min-h-dvh shrink-0 overflow-hidden border-r",
            sidebarClassName,
          )}
        >
          {sidebar}
        </aside>
        <main
          data-slot="dual-sidebar-layout-content"
          className={cn("min-w-0 flex-1 overflow-auto", contentClassName)}
        >
          {children}
        </main>
      </div>
    </DualSidebarProvider>
  );
}
