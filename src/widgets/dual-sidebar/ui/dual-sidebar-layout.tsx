import type { ComponentProps, JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { DualSidebarProvider } from "../model/dual-sidebar-context";
import { DualSidebar } from "./dual-sidebar";

type DualSidebarLayoutProps = ComponentProps<"div"> & {
  sidebarClassName?: string;
  contentClassName?: string;
  defaultSidebarOpen?: boolean;
};

// 承载左侧双侧边栏和右侧主内容区的应用级布局。
export function DualSidebarLayout({
  className,
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
        <DualSidebar className={sidebarClassName} />
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
