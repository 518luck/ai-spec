"use client";

import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { useDualSidebarContext } from "../model/dual-sidebar-context";

type DualSidebarProps = Omit<ComponentProps<"aside">, "children"> & {
  businessNav: ReactNode;
  operationNav: ReactNode;
  businessNavClassName?: string;
  operationNavClassName?: string;
};

// 渲染双栏侧边栏，左侧承载业务划分，右侧承载操作划分。
export function DualSidebar({
  className,
  businessNav,
  operationNav,
  businessNavClassName,
  operationNavClassName,
  ...props
}: DualSidebarProps): JSX.Element {
  // 读取右侧操作导航栏的展开状态，左侧业务导航栏始终保留。
  const { open } = useDualSidebarContext();

  return (
    <aside
      data-slot="dual-sidebar"
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "bg-sidebar text-sidebar-foreground flex min-h-dvh shrink-0 overflow-hidden",
        className,
      )}
      {...props}
    >
      <nav
        aria-label="业务导航"
        data-slot="dual-sidebar-business-nav"
        className={cn(
          "flex w-16 shrink-0 flex-col items-center border-r",
          businessNavClassName,
        )}
      >
        {businessNav}
      </nav>

      <nav
        aria-label="操作导航"
        aria-hidden={!open}
        data-slot="dual-sidebar-operation-nav"
        data-state={open ? "expanded" : "collapsed"}
        className={cn(
          "flex min-w-0 flex-col overflow-hidden transition-[width] duration-200 ease-linear",
          operationNavClassName,
          open ? "w-64" : "w-0",
        )}
      >
        {open ? operationNav : null}
      </nav>
    </aside>
  );
}
