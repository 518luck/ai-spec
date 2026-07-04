"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";
import * as React from "react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Separator } from "@/shared/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

// 持久化桌面端侧边栏展开状态的 Cookie 名称。
const SIDEBAR_COOKIE_NAME = "sidebar_state";
// 侧边栏状态保留 7 天，避免用户每次进入页面都要重新展开或折叠。
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
// 桌面端完整展开时的默认宽度。
const SIDEBAR_WIDTH = "16rem";
// 移动端抽屉形态的宽度，略宽于桌面端以适配触控操作。
const SIDEBAR_WIDTH_MOBILE = "18rem";
// icon 折叠模式下保留的最小侧栏宽度。
const SIDEBAR_WIDTH_ICON = "3rem";
// 全局快捷键：Cmd/Ctrl + B 切换侧边栏。
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

// 描述 SidebarProvider 向所有侧边栏子组件共享的状态和操作。
type SidebarContextProps = {
  // 桌面端侧边栏的语义状态，用于驱动 data-state 样式选择器。
  state: "expanded" | "collapsed";
  // 桌面端侧边栏当前是否展开。
  open: boolean;
  // 设置桌面端侧边栏展开状态，支持受控和非受控两种模式。
  setOpen: (open: boolean) => void;
  // 移动端 Sheet 侧边栏当前是否打开。
  openMobile: boolean;
  // 设置移动端 Sheet 侧边栏打开状态。
  setOpenMobile: (open: boolean) => void;
  // 当前是否命中移动端断点。
  isMobile: boolean;
  // 根据当前设备自动切换桌面端或移动端侧边栏。
  toggleSidebar: () => void;
};

// 在 Sidebar 组合组件之间共享展开状态，避免多层 props drilling。
const SidebarContext = React.createContext<SidebarContextProps | null>(null);

// 读取 Sidebar 上下文，并在缺少 Provider 时给出明确错误。
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

// 管理侧边栏的受控/非受控状态、移动端状态、快捷键和样式变量。
function SidebarProvider({
  defaultOpen = true, //侧边栏默认是否展开。
  open: openProp, //外部传进来的 open。
  onOpenChange: setOpenProp, // 外部传进来的 onOpenChange 回调。

  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  // 根据响应式断点决定后续切换逻辑走桌面端折叠还是移动端抽屉。
  const isMobile = useIsMobile();
  // 移动端使用独立状态，避免移动抽屉打开/关闭影响桌面端折叠偏好。
  const [openMobile, setOpenMobile] = React.useState(false);

  // 非受控模式下的内部桌面端状态；受控模式优先使用外部 openProp。
  const [_open, _setOpen] = React.useState(defaultOpen);
  // 同时兼容外部受控状态和组件内部默认状态。
  const open = openProp ?? _open;
  // 统一的桌面端状态更新入口，负责同步外部回调、内部状态和 Cookie。
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      // 兼容 setState 风格的函数式更新，确保调用方可以基于当前状态取反。
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // 将桌面端展开状态写入 Cookie，供后续页面加载时恢复用户偏好。
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  // 根据当前设备类型选择正确的切换目标：移动端 Sheet 或桌面端折叠态。
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen]);

  // 注册 Cmd/Ctrl + B 快捷键，让用户无需点击按钮即可切换侧边栏。
  React.useEffect(() => {
    // 只处理配置的组合快捷键，避免普通输入 b 时误触发。
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // 将布尔 open 转成 data-state 友好的语义值，方便 Tailwind group-data-* 联动。
  const state = open ? "expanded" : "collapsed";

  // 缓存上下文对象，减少 Provider 下游组件的无意义重新渲染。
  // 这个是比较值得学习的,使用了useMemo 可以避免值对象不变化 要不然虽然里面的值可能没变，但对象引用变了。对于 Context 来说：会让所有使用 useSidebar() 的子组件认为 Context 更新了，可能导致不必要的重新渲染。
  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state, //："expanded" / "collapsed"
      open, //桌面端是否展开
      setOpen, //设置桌面端展开状态
      isMobile, //当前是不是移动端
      openMobile, //移动端抽屉是否打开
      setOpenMobile, //设置移动端抽屉打开状态
      toggleSidebar, //切换侧边栏展开/收起（桌面端）或打开/关闭（移动端）
    }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* 外层包装负责注入 CSS 变量，并作为 inset/floating 变体的样式作用域。 */}
      {/* 大致结构
      <SidebarProvider>
        <Sidebar />
        <SidebarInset />
      </SidebarProvider> */}
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            // 子组件通过 w-(--sidebar-width) 等 Tailwind 任意值读取这些宽度。
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// 根据设备类型和折叠配置渲染真正的侧边栏容器。
function Sidebar({
  // 控制侧边栏停靠方向，默认渲染在左侧。
  side = "left",
  // 控制侧边栏视觉形态：普通贴边、浮动卡片或 inset 内嵌布局。
  variant = "sidebar",
  // 控制侧边栏折叠方式，默认 offcanvas 表示折叠时滑出屏幕。
  collapsible = "offcanvas",
  // 允许调用方追加或覆盖侧边栏容器的样式类。
  className,
  // 侧边栏内部内容，例如 Header、Content、Footer、Menu 等组合组件。
  children,
  // 透传文本方向，主要给移动端 SheetContent 处理 ltr/rtl 布局。
  dir,
  // 收集剩余 div 属性，例如 id、data-*、aria-*、onClick 等。
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  // 从 Provider 获取响应式状态，桌面端和移动端使用不同展示策略。
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  // none 模式完全关闭折叠能力，适合始终可见的固定侧栏。
  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  // 移动端不使用桌面端占位和固定定位，而是使用 Sheet 作为抽屉面板。
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          {/* Sheet 需要标题和描述满足无障碍要求，这里只对屏幕阅读器可见。 */}
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // 桌面端根节点不直接承载内容，而是提供状态、方向和变体的样式作用域。
  // group 让内部元素读取父级 data-*，peer 让相邻主内容区域读取侧边栏状态。
  // hidden md:block 表示移动端隐藏这套桌面结构，只在中等及以上屏幕启用。
  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      // 标记当前展开状态，主要给同级或后代选择器判断 expanded/collapsed。
      data-state={state}
      // 只有折叠时才暴露折叠模式，展开时清空以避免命中折叠样式。
      data-collapsible={state === "collapsed" ? collapsible : ""}
      // 标记视觉变体，内部元素据此切换普通、浮动或 inset 样式。
      data-variant={variant}
      // 标记停靠方向，内部元素据此选择 left/right 定位和边框方向。
      data-side={side}
      // 标记该 DOM 是 Sidebar 组件系统的桌面端根插槽。
      data-slot="sidebar"
    >
      {/* 桌面端占位层：保留布局宽度，折叠或 offcanvas 时通过宽度动画收缩。 */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      {/* 实际侧栏层：固定在视口边缘，依据 side 和 collapsible 移动或变窄。 */}
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear data-[side=right]:right-0 data-[side=left]:left-0 data-[side=right]:group-data-[collapsible=offcanvas]:-right-(--sidebar-width) data-[side=left]:group-data-[collapsible=offcanvas]:-left-(--sidebar-width) md:flex",
          // floating/inset 需要额外内边距给圆角、阴影和内容区域留出呼吸感。
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
        >
          {/* 内层负责承载侧边栏背景；floating 模式在这里添加圆角、阴影和描边。 */}
          {children}
        </div>
      </div>
    </div>
  );
}

// 渲染侧边栏开关按钮，点击时先执行调用方事件，再切换全局侧边栏状态。
function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={(event) => {
        // 保留外部传入的点击逻辑，再执行组件内置切换行为。
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

// 渲染桌面端侧边栏边缘热区，允许用户点击侧栏边缘快速展开或折叠。
function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        // 伪元素扩大可点击区域，hover 时显示一条边框色提示线。
        "absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear after:absolute after:inset-s-1/2 after:inset-y-0 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
        // 根据侧边栏方向和当前折叠状态切换 resize 光标方向。
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        // offcanvas 模式下热区贴近屏幕边缘，便于侧栏完全收起后再次唤出。
        "group-data-[collapsible=offcanvas]:translate-x-0 hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

// 渲染与 inset 变体配套的主内容区域，桌面端会根据侧栏状态自动调整外边距。
function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

// 渲染适配侧边栏视觉系统的输入框，通常用于侧栏内搜索或过滤。
function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("h-8 w-full bg-background shadow-none", className)}
      {...props}
    />
  );
}

// 渲染侧边栏顶部区域，通常放置产品标识、项目切换器或搜索入口。
function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

// 渲染侧边栏底部区域，通常放置账户入口、设置或退出登录等固定操作。
function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

// 渲染侧边栏内部分隔线，并使用 sidebar 语义色保持主题一致。
function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  );
}

// 渲染侧边栏可滚动内容区，折叠为 icon 时隐藏滚动条避免溢出。
function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

// 渲染一个侧边栏分组容器，用于组织一组标题、操作按钮和菜单项。
function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

// 渲染分组标题，支持通过 render 替换底层元素以适配链接或自定义组件。
function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
  // useRender 负责合并默认 props 和自定义 render，保留 Base UI 的组合能力。
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    // state 会被传给 render 目标，用于保留 slot/sidebar 元数据。
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
    },
  });
}

// 渲染分组右上角操作按钮，常用于添加、更多菜单或折叠分组操作。
function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
  // icon 折叠态隐藏分组操作，避免和主导航图标抢占同一列空间。
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    render,
    // slot/sidebar 元数据让自定义 render 仍能被样式和测试稳定识别。
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  });
}

// 渲染分组内容容器，承载菜单列表或其他分组内元素。
function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

// 渲染一级菜单列表容器，要求子元素通常使用 SidebarMenuItem。
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

// 渲染一级菜单项容器，为按钮、徽标和右侧操作提供定位上下文。
function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

// 定义一级菜单按钮的变体样式，集中处理 hover、active、禁用和折叠 icon 态。
const sidebarMenuButtonVariants = cva(
  "peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // variant 控制按钮的基础视觉风格，outline 会额外显示边框感阴影。
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      // size 控制按钮高度和文字大小，lg 在 icon 折叠态去掉额外内边距。
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// 渲染一级菜单按钮，支持 active 状态、尺寸变体和折叠态 Tooltip。
function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar();
  // 先生成基础按钮；如果存在 tooltip，再把它作为 TooltipTrigger 使用。
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      },
      props,
    ),
    render: !tooltip ? render : <TooltipTrigger render={render} />,
    // 将 size/active 状态暴露给样式选择器和自定义 render。
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      active: isActive,
    },
  });

  if (!tooltip) {
    return comp;
  }

  // 字符串形式的 tooltip 会被转换成 TooltipContent 可接收的 props 对象。
  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      {comp}
      {/* 只有桌面端 icon 折叠态才显示 Tooltip；移动端 Sheet 内保留完整文字。 */}
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

// 渲染菜单项右侧操作按钮，可配置为只在 hover/focus 时出现。
function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean;
  }) {
  // 操作按钮绝对定位在菜单项右侧，并根据相邻菜单按钮尺寸调整纵向位置。
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          // showOnHover 模式默认在桌面端隐藏，菜单项 hover、focus 或展开时再显示。
          showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0",
          className,
        ),
      },
      props,
    ),
    render,
    // 保留操作按钮的语义元数据，便于样式和测试定位。
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  });
}

// 渲染菜单项右侧徽标，例如未读数量、状态计数或快捷提示。
function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 font-medium text-sidebar-foreground text-xs tabular-nums peer-hover/menu-button:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

// 渲染菜单项加载骨架，模拟真实菜单文本宽度以降低加载时的视觉跳动。
function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // 随机生成 50% 到 90% 的文本宽度，让多条骨架看起来更接近真实内容。
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  });

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
      {/* 文本骨架通过 CSS 变量接收随机宽度，避免生成动态 className。 */}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

// 渲染二级菜单列表，通常嵌套在某个一级菜单项下。
function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-sidebar-border border-l px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

// 渲染二级菜单项容器，为二级链接按钮提供定位和分组上下文。
function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

// 渲染二级菜单链接按钮，适合用于更细粒度的导航入口。
function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    size?: "sm" | "md";
    isActive?: boolean;
  }) {
  // 二级菜单在 icon 折叠态隐藏，避免只有缩进线和短文本造成信息不完整。
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
          className,
        ),
      },
      props,
    ),
    render,
    // 暴露 size/active 状态，便于 Tailwind data-* 选择器设置尺寸和激活态。
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
  });
}

// 统一导出 Sidebar 组合组件和 Hook，业务代码可按需要自由组合各个插槽。
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
