"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useDualSidebarContext } from "../model/dual-sidebar-context";
import { dualSidebarZoneClasses } from "../model/dual-sidebar-styles";
import type {
  NavBusinessArea,
  NavBusinessItem as NavBusinessItemData,
  NavContext,
} from "../model/navigation-data";
import {
  getCurrentNavBusinessArea,
  getNavBusinessItems,
  navAreaPanels,
  navBusinessAreas,
} from "../model/navigation-data";
import { AnimatedArea } from "./animated-area";
import { AnimatedNavIcon } from "./animated-nav-icon";

type DualSidebarProps = Omit<ComponentProps<"aside">, "children">;

type NavBusinessItemBaseProps = {
  children: ReactNode;
  className?: string;
};

type NavAreasPanelProps = {
  open: boolean;
  currentBusinessArea: NavBusinessArea | null;
  navContext: NavContext;
  className?: string;
};

type NavBusinessItemProps = NavBusinessItemBaseProps & {
  item: NavBusinessItemData;
};

// 渲染双栏侧边栏，左侧承载业务划分，右侧承载操作划分。
export function DualSidebar({
  className,
  ...props
}: DualSidebarProps): JSX.Element {
  // 读取右侧操作导航栏的展开状态，左侧业务导航栏始终保留。
  const { open } = useDualSidebarContext();

  const pathname = usePathname();
  const navContext = { pathname: pathname ?? "" };
  const businessNavItems = getNavBusinessItems(navContext);
  const currentBusinessArea = getCurrentNavBusinessArea(navContext);

  return (
    <aside
      data-slot="dual-sidebar"
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "flex min-h-dvh max-w-76 shrink-0 overflow-hidden border-r transition-[width] duration-200 ease-linear",
        open ? "w-76" : "w-16",
        className,
      )}
      {...props}
    >
      {/* 左侧导航栏 */}
      <nav
        aria-label="业务导航"
        data-slot="dual-sidebar-business-nav"
        className={cn(
          dualSidebarZoneClasses.businessNav.shell,
          "flex w-16 shrink-0 flex-col items-center justify-between border-r py-3",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/"
            aria-label="产品入口"
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground flex size-10 items-center justify-center rounded-md"
          >
            <Icons.logo className="size-7" />
          </Link>

          <div
            data-slot="dual-sidebar-business-nav-content"
            className="mt-6 flex flex-col items-center gap-5"
          >
            {businessNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavBusinessItem key={item.href} item={item}>
                  <Icon className="size-6" />
                </NavBusinessItem>
              );
            })}
          </div>
        </div>

        <div
          data-slot="dual-sidebar-resource-nav"
          className="text-muted-foreground flex flex-col items-center gap-2"
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

      {/* 右侧导航栏 */}
      <NavAreasPanel
        open={open}
        currentBusinessArea={currentBusinessArea}
        navContext={navContext}
      />
    </aside>
  );
}

// 渲染左侧图标导航项，并通过 Tooltip 补充文字说明。
function NavBusinessItem({
  item,
  children,
  className,
}: NavBusinessItemProps): JSX.Element {
  const { name, description, learnMoreHref, href, active, iconAnimation } =
    item;
  const hasDetail = Boolean(description || learnMoreHref);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            aria-label={name}
            data-active={active}
            className={cn(
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground flex size-9 items-center justify-center rounded-md transition-colors",
              className,
            )}
          >
            <AnimatedNavIcon animation={iconAnimation ?? "none"}>
              {children}
            </AnimatedNavIcon>
          </Link>
        }
      />
      <TooltipContent
        side="right"
        showArrow={false}
        className="flex-col items-start gap-0"
      >
        <div className="font-medium">{name}</div>
        {hasDetail ? (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, width: 0, opacity: 0 }}
            animate={{ height: "auto", width: "auto", opacity: 1 }}
            transition={{
              delay: 0.5,
              duration: 0.25,
              type: "tween",
            }}
          >
            <div className="flex w-44 flex-col gap-1 leading-snug">
              {description ? (
                <div className="text-background/65">{description}</div>
              ) : null}
              {learnMoreHref ? (
                <Link
                  href={learnMoreHref}
                  className="text-background underline-offset-2 hover:underline"
                >
                  查看详情
                </Link>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

// 渲染右侧区域操作面板，随双栏状态展开或折叠。
function NavAreasPanel({
  open,
  currentBusinessArea,
  navContext,
  className,
}: NavAreasPanelProps): JSX.Element {
  // 路径未匹配业务区域时，保留默认面板以避免右侧内容整块消失。
  const visibleBusinessArea = currentBusinessArea ?? "personal";

  return (
    <nav
      aria-label="操作导航"
      aria-hidden={!open}
      data-slot="dual-sidebar-operation-nav"
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        dualSidebarZoneClasses.operationNav.shell,
        "flex min-w-0 overflow-hidden py-2 transition-[width] duration-200 ease-linear",
        open ? "flex-1" : "w-0",
        className,
      )}
    >
      <div
        data-slot="dual-sidebar-operation-nav-panel"
        className={cn(
          dualSidebarZoneClasses.operationNav.surface,
          "mr-2 flex min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-xl transition-opacity duration-200 ease-linear",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {navBusinessAreas.map((businessArea) => {
            const navAreaPanel = navAreaPanels[businessArea](navContext);

            return (
              <AnimatedArea
                key={businessArea}
                visible={visibleBusinessArea === businessArea}
                direction={navAreaPanel.direction ?? "right"}
              >
                <div
                  data-slot="dual-sidebar-operation-nav-content"
                  className="flex min-h-0 flex-col gap-4 overflow-auto px-2 py-3"
                >
                  <div className="text-lg font-semibold">
                    {navAreaPanel.title}
                  </div>

                  {/* 菜单分组 */}
                  <div className="flex flex-col gap-8">
                    {navAreaPanel.content.map((group) => (
                      <div
                        key={group.name ?? "default"}
                        className="flex flex-col gap-2"
                      >
                        {group.name ? (
                          <div className="text-muted-foreground/70 px-4 text-sm font-medium">
                            {group.name}
                          </div>
                        ) : null}

                        <div className="flex flex-col">
                          {group.items.map((item) => {
                            const Icon = item.icon;

                            return (
                              <div
                                key={item.href}
                                className="flex flex-col gap-1"
                              >
                                <Link
                                  href={item.href}
                                  data-active={item.active}
                                  className="text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors"
                                >
                                  <Icon className="size-4 shrink-0" />
                                  <span className="min-w-0 truncate">
                                    {item.name}
                                  </span>
                                </Link>

                                {item.items ? (
                                  <div className="ml-4 flex flex-col gap-1">
                                    {item.items.map((subItem) => (
                                      <Link
                                        key={subItem.href}
                                        href={subItem.href}
                                        data-active={subItem.active}
                                        className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground rounded-md px-2 py-1.5 text-sm transition-colors"
                                      >
                                        <span className="block min-w-0 truncate">
                                          {subItem.name}
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedArea>
            );
          })}
        </div>

        <div
          data-slot="dual-sidebar-operation-nav-footer"
          className="flex flex-col gap-2 p-3"
        >
          <div className="text-muted-foreground text-xs font-medium">
            底部固定栏
          </div>
        </div>
      </div>
    </nav>
  );
}
