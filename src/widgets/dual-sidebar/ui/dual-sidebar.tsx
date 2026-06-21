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
import {
  SIDEBAR_COMPACT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "../model/sidebar-config";
import { AnimatedArea } from "./animated-area";
import { AnimatedNavIcon } from "./animated-nav-icon";
import { IconButton } from "./icon-button";
import { SidebarResizeHandle } from "./sidebar-resize-handle";
import { UserAvatarPopover } from "./user-avatar-popover";

// motion.aside 的 props 类型，兼容原生 aside 属性并支持动画相关 props
type DualSidebarProps = Omit<ComponentProps<typeof motion.aside>, "children">;

type NavBusinessItemBaseProps = {
  children: ReactNode;
  className?: string;
};

type NavAreasPanelProps = {
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
  // 读取侧边栏宽度/紧凑/拖拽状态，左侧业务导航栏始终保留。
  const { width, collapsed, isResizing } = useDualSidebarContext();

  const pathname = usePathname();
  const navContext = { pathname: pathname ?? "" };
  const businessNavItems = getNavBusinessItems(navContext);
  const currentBusinessArea = getCurrentNavBusinessArea(navContext);

  // aside 宽度：collapsed 紧凑模式(128px)；否则用拖拽存储宽度并钳制到合法范围
  const asideWidth = collapsed
    ? SIDEBAR_COMPACT_WIDTH
    : Math.max(SIDEBAR_MIN_WIDTH, Math.min(width, SIDEBAR_MAX_WIDTH));

  return (
    <motion.aside
      data-slot="dual-sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      animate={{ width: asideWidth }}
      // 首屏直接渲染目标宽度，不执行入场动画，避免从 0 闪烁展开
      initial={false}
      // 拖拽中用 duration:0 瞬时跳变保证手柄即时跟随指针；非拖拽时用弹簧曲线实现收缩/展开的轻微回弹
      transition={
        isResizing
          ? { type: "tween", duration: 0 }
          : { type: "spring", stiffness: 300, damping: 28, bounce: 0.18 }
      }
      className={cn("flex min-h-dvh shrink-0 overflow-hidden", className)}
      {...props}
    >
      {/* 左侧导航栏 */}
      <nav
        aria-label="业务导航"
        data-slot="dual-sidebar-business-nav"
        className={cn(
          dualSidebarZoneClasses.businessNav.shell,
          "flex w-16 shrink-0 flex-col items-center justify-between py-6",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/"
            aria-label="产品入口"
            className="s flex items-center justify-center rounded-md"
          >
            <Icons.logo className="size-8" />
          </Link>

          <div
            data-slot="dual-sidebar-business-nav-content"
            className="mt-2 flex flex-col items-center gap-5"
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
          <UserAvatarPopover />
        </div>
      </nav>

      {/* 右侧导航栏 */}
      <NavAreasPanel
        currentBusinessArea={currentBusinessArea}
        navContext={navContext}
      />
    </motion.aside>
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
                  className="text-background underline underline-offset-2"
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

// 渲染右侧区域操作面板，紧凑模式下隐藏文字只留图标/点。
function NavAreasPanel({
  currentBusinessArea,
  navContext,
  className,
}: NavAreasPanelProps): JSX.Element {
  // 路径未匹配业务区域时，保留默认面板以避免右侧内容整块消失。
  const visibleBusinessArea = currentBusinessArea ?? "personal";
  // 紧凑模式下隐藏标题/分组文字，一级只留图标、二级只留点
  const { collapsed, toggleCollapsed, resetWidth } = useDualSidebarContext();

  return (
    <nav
      aria-label="操作导航"
      data-slot="dual-sidebar-operation-nav"
      data-state={collapsed ? "collapsed" : "expanded"}
      className={cn(
        dualSidebarZoneClasses.operationNav.shell,
        "relative flex min-w-0 flex-1 overflow-hidden py-2",
        className,
      )}
    >
      <div
        data-slot="dual-sidebar-operation-nav-panel"
        className={cn(
          dualSidebarZoneClasses.operationNav.surface,
          "mr-2 flex min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-xl",
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
                  className="flex min-h-0 flex-col gap-4 overflow-auto px-2 py-6"
                >
                  <div
                    className={cn(
                      "flex items-center",
                      collapsed
                        ? "justify-center"
                        : "ml-2 justify-between pr-2",
                    )}
                  >
                    {collapsed ? null : (
                      <div className="min-w-0 truncate text-lg font-semibold">
                        {navAreaPanel.title}
                      </div>
                    )}
                    {collapsed ? (
                      <IconButton label="展开侧边栏" onClick={toggleCollapsed}>
                        <Icons.sidebarExpand className="size-4" />
                      </IconButton>
                    ) : (
                      <div className="flex shrink-0 items-center">
                        <IconButton
                          label="收起侧边栏"
                          tooltip="收起"
                          onClick={toggleCollapsed}
                        >
                          <Icons.sidebarCollapse className="size-4" />
                        </IconButton>
                        <IconButton
                          label="恢复默认宽度"
                          tooltip="重置"
                          onClick={resetWidth}
                        >
                          <Icons.sidebarReset className="size-4" />
                        </IconButton>
                      </div>
                    )}
                  </div>

                  {/* 菜单分组 */}
                  <div className="flex flex-col gap-8">
                    {navAreaPanel.content.map((group) => (
                      <div
                        key={group.name ?? "default"}
                        className="flex flex-col gap-2"
                      >
                        {!collapsed && group.name ? (
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
                                  className={cn(
                                    "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground flex items-center rounded-md text-sm transition-colors",
                                    collapsed
                                      ? "size-9 shrink-0 justify-center"
                                      : "gap-2 px-2 py-2",
                                  )}
                                >
                                  <Icon className="size-4 shrink-0" />
                                  {collapsed ? null : (
                                    <span className="min-w-0 truncate">
                                      {item.name}
                                    </span>
                                  )}
                                </Link>

                                {item.items ? (
                                  <div
                                    className={cn(
                                      "flex flex-col gap-1",
                                      collapsed ? "" : "ml-4",
                                    )}
                                  >
                                    {item.items.map((subItem) => (
                                      <Link
                                        key={subItem.href}
                                        href={subItem.href}
                                        data-active={subItem.active}
                                        className={cn(
                                          "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground rounded-md transition-colors",
                                          collapsed
                                            ? "flex size-9 shrink-0 items-center justify-center"
                                            : "px-2 py-1.5 text-sm",
                                        )}
                                      >
                                        {collapsed ? (
                                          <span
                                            aria-label={subItem.name}
                                            className="size-1.5 rounded-full bg-current opacity-60"
                                          />
                                        ) : (
                                          <span className="block min-w-0 truncate">
                                            {subItem.name}
                                          </span>
                                        )}
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

      {/* 拖拽缩放手柄：贴在操作面板右边缘（补偿 surface 的 mr-2） */}
      <SidebarResizeHandle />
    </nav>
  );
}
