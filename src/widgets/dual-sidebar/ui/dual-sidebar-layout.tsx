import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { DualSidebarProvider } from "../model/dual-sidebar-context";
import { dualSidebarZoneClasses } from "../model/dual-sidebar-styles";
import { DualSidebar } from "./dual-sidebar";

type DualSidebarLayoutProps = ComponentProps<"div"> & {
  sidebarClassName?: string;
  contentClassName?: string;
  defaultSidebarOpen?: boolean;
};

type PageContentProps = ComponentProps<"div"> & {
  title?: ReactNode;
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
        <PageContent>{children}</PageContent>
      </div>
    </main>
  );
}

// 页面内容区容器，提供可选标题栏和可滚动内容区。
function PageContent({
  title,
  className,
  children,
  ...props
}: PageContentProps): JSX.Element {
  return (
    <div
      data-slot="dual-sidebar-layout-page-content"
      className={cn("flex h-full min-h-0 flex-col", className)}
      {...props}
    >
      {title ? (
        <div
          data-slot="dual-sidebar-layout-page-header"
          className="flex h-16 shrink-0 items-center border-b px-6"
        >
          {typeof title === "string" ? (
            <h1 className="text-base font-semibold">{title}</h1>
          ) : (
            title
          )}
        </div>
      ) : null}

      <div
        data-slot="dual-sidebar-layout-page-body"
        className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto p-6"
      >
        {children}
      </div>
    </div>
  );
}
