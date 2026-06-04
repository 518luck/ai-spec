"use client";

import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";
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
          "flex w-16 shrink-0 flex-col items-center justify-between border-r py-3",
          businessNavClassName,
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            aria-label="产品入口"
            data-slot="dual-sidebar-product"
            className="bg-sidebar-primary text-sidebar-primary-foreground flex size-10 items-center justify-center rounded-md"
          >
            <Icons.logo className="size-5" />
          </div>

          <div
            data-slot="dual-sidebar-business-nav-content"
            className="flex flex-col items-center gap-2"
          >
            {businessNav}
          </div>
        </div>

        <div
          data-slot="dual-sidebar-resource-nav"
          className="text-sidebar-foreground/70 flex flex-col items-center gap-2"
        >
          <div
            aria-label="活动入口占位"
            className="flex size-9 items-center justify-center rounded-md"
          >
            <Icons.gift className="size-5" />
          </div>
          <div
            aria-label="文档帮助入口占位"
            className="flex size-9 items-center justify-center rounded-md"
          >
            <Icons.helpCircle className="size-5" />
          </div>
        </div>
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
