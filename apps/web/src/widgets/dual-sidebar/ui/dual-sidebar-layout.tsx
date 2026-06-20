import type { ComponentProps, JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { DualSidebarProvider } from "../model/dual-sidebar-context";
import { dualSidebarZoneClasses } from "../model/dual-sidebar-styles";
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
          dualSidebarZoneClasses.layout.shell,
          "flex min-h-dvh w-full overflow-hidden",
          className,
        )}
        {...props}
      >
        <DualSidebar className={sidebarClassName} />

        <DualSidebarContent className={contentClassName}>
          {children}
        </DualSidebarContent>
      </div>
    </DualSidebarProvider>
  );
}

// 渲染双栏布局主内容区壳层，分离布局容器和视觉留白。
function DualSidebarContent({
  className,
  children,
  ...props
}: ComponentProps<"main">): JSX.Element {
  return (
    <main
      data-slot="dual-sidebar-layout-content"
      className={cn(
        dualSidebarZoneClasses.content.shell,
        "flex min-w-0 flex-1 py-2",
        className,
      )}
      {...props}
    >
      <div
        data-slot="dual-sidebar-layout-content-inner"
        className={cn(
          dualSidebarZoneClasses.content.surface,
          "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl",
        )}
      >
        {children}
      </div>
    </main>
  );
}
