"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useDualSidebarContext } from "../model/dual-sidebar-context";
import type {
  NavBusinessItem as NavBusinessItemData,
  NavIconAnimation,
} from "../model/navigation-data";
import { getNavBusinessItems } from "../model/navigation-data";

type DualSidebarProps = Omit<ComponentProps<"aside">, "children">;

type NavBusinessItemBaseProps = {
  children: ReactNode;
  className?: string;
};

type NavBusinessItemProps = NavBusinessItemBaseProps & {
  item: NavBusinessItemData;
};

type AnimatedNavIconProps = {
  animation?: NavIconAnimation;
  children: ReactNode;
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
          <Link
            href="/"
            aria-label="产品入口"
            className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground flex size-10 items-center justify-center rounded-md"
          >
            <Icons.logo className="size-5" />
          </Link>

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
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground flex size-9 items-center justify-center rounded-md transition-colors",
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

// 为导航图标提供可配置的悬停动画反馈。
function AnimatedNavIcon({
  animation = "none",
  children,
}: AnimatedNavIconProps): JSX.Element {
  if (animation === "rotate") {
    return (
      <motion.span
        className="inline-flex size-full items-center justify-center"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      >
        {children}
      </motion.span>
    );
  }

  if (animation === "shake") {
    return (
      <motion.span
        className="inline-flex size-full items-center justify-center"
        whileHover={{
          rotate: [0, -8, 8, -5, 5, 0],
          x: [0, -2, 2, -1, 1, 0],
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center">{children}</span>
  );
}
