"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useDualSidebarContext } from "../model/dual-sidebar-context";
import type { NavBusinessItem as NavBusinessItemData } from "../model/navigation-data";
import { getNavBusinessItems } from "../model/navigation-data";

type DualSidebarProps = Omit<ComponentProps<"aside">, "children">;

type NavBusinessItemBaseProps = {
  children: ReactNode;
  className?: string;
};

type NavBusinessItemProps = NavBusinessItemBaseProps & {
  item?: NavBusinessItemData;
  label?: string;
  href?: string;
  active?: boolean;
};

// 渲染双栏侧边栏，左侧承载业务划分，右侧承载操作划分。
export function DualSidebar({
  className,
  ...props
}: DualSidebarProps): JSX.Element {
  // 读取右侧操作导航栏的展开状态，左侧业务导航栏始终保留。
  const { open } = useDualSidebarContext();
  const pathname = usePathname();
  const businessNavItems = getNavBusinessItems({ pathname: pathname ?? "" });

  return (
    <aside
      data-slot="dual-sidebar"
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "bg-sidebar text-sidebar-foreground flex min-h-dvh shrink-0 overflow-hidden border-r",
        className,
      )}
      {...props}
    >
      <nav
        aria-label="业务导航"
        data-slot="dual-sidebar-business-nav"
        className="flex w-16 shrink-0 flex-col items-center justify-between border-r py-3"
      >
        <div className="flex flex-col items-center gap-3">
          <NavBusinessItem
            label="产品入口"
            active
            className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground size-10"
          >
            <Icons.logo className="size-5" />
          </NavBusinessItem>

          <div
            data-slot="dual-sidebar-business-nav-content"
            className="flex flex-col items-center gap-2"
          >
            {businessNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavBusinessItem key={item.href} item={item}>
                  <Icon className="size-5" />
                </NavBusinessItem>
              );
            })}
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
          open ? "w-64" : "w-0",
        )}
      >
        {open ? (
          <div className="flex flex-col gap-2 p-3">
            <div className="text-muted-foreground px-2 text-xs font-medium">
              操作菜单栏
            </div>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}

// 渲染左侧图标导航项，并通过 Tooltip 补充文字说明。
function NavBusinessItem({
  item,
  label,
  children,
  href,
  active = false,
  className,
}: NavBusinessItemProps): JSX.Element {
  const itemLabel = item?.name ?? label ?? "";
  const itemHref = item?.href ?? href;
  const itemActive = item?.active ?? active;
  const triggerClassName = cn(
    "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground flex size-9 items-center justify-center rounded-md transition-colors",
    className,
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          itemHref === undefined ? (
            <button
              type="button"
              aria-label={itemLabel}
              data-active={itemActive}
              className={triggerClassName}
            >
              {children}
            </button>
          ) : (
            <Link
              href={itemHref}
              aria-label={itemLabel}
              data-active={itemActive}
              className={triggerClassName}
            >
              {children}
            </Link>
          )
        }
      />
      <TooltipContent side="right">{itemLabel}</TooltipContent>
    </Tooltip>
  );
}
