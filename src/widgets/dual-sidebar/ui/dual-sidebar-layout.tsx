import type { ComponentProps, JSX } from "react";
import { cookies } from "next/headers";

import { cn } from "@/shared/lib/utils";
import { DualSidebarProvider } from "../model/dual-sidebar-context";
import { dualSidebarZoneClasses } from "../model/dual-sidebar-styles";
import {
  SIDEBAR_COLLAPSED_COOKIE,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_WIDTH_COOKIE,
} from "../model/sidebar-config";
import { DualSidebar } from "./dual-sidebar";

type DualSidebarLayoutProps = ComponentProps<"div"> & {
  sidebarClassName?: string;
  contentClassName?: string;
  defaultSidebarOpen?: boolean;
};

// 承载左侧双侧边栏和右侧主内容区的应用级布局。
export async function DualSidebarLayout({
  className,
  sidebarClassName,
  contentClassName,
  defaultSidebarOpen,
  children,
  ...props
}: DualSidebarLayoutProps): Promise<JSX.Element> {
  // 服务端读取 cookie，把用户上次的宽度与折叠状态作为 SSR 默认值，避免首屏闪烁
  const cookieStore = await cookies();
  const widthRaw = cookieStore.get(SIDEBAR_WIDTH_COOKIE)?.value;
  const collapsedRaw = cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value;
  const defaultWidth = widthRaw
    ? Number.parseInt(widthRaw, 10) || SIDEBAR_DEFAULT_WIDTH
    : SIDEBAR_DEFAULT_WIDTH;
  const defaultCollapsed = collapsedRaw === "true";

  return (
    <DualSidebarProvider
      defaultOpen={defaultSidebarOpen}
      defaultWidth={defaultWidth}
      defaultCollapsed={defaultCollapsed}
    >
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
