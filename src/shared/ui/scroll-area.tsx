"use client";

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "@/shared/lib/utils";

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        // max-h-[inherit] 让 Viewport 继承 Root 的 max-h-*，使「按需滚动」生效：
        // 内容超出时由 max-height 触发内部 overflow:scroll；内容不足时自动收缩。
        // 单纯的 h-full 因 Root 高度为 auto 无法解析，会导致内容被裁切且不出现滚动条。
        className="focus-visible:ring-ring/50 max-h-[inherit] w-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      // 滚动条默认隐藏（opacity-0），鼠标进入滚动区域（data-hovering）或正在滚动
      // （data-scrolling）时淡入显示，鼠标移出自动隐藏。
      className={cn(
        "flex touch-none p-px opacity-0 transition-opacity duration-200 select-none",
        "data-hovering:opacity-100 data-scrolling:opacity-100",
        "data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
