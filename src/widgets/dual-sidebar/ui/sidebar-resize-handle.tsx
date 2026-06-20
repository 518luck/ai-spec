"use client";

import { type JSX, type PointerEvent, useRef } from "react";

import { cn } from "@/shared/lib/utils";
import { useDualSidebarContext } from "../model/dual-sidebar-context";
import { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH } from "../model/sidebar-config";

// 侧边栏右边缘拖拽手柄：pointerdown 捕获指针，move 实时改宽并钳制到合法范围，up 释放
export function SidebarResizeHandle(): JSX.Element {
  const { setWidth, setIsResizing } = useDualSidebarContext();
  // 拖拽起点记录的 aside 左边缘（clientX 减它即新宽度），以及拖拽进行中标记
  const asideLeftRef = useRef(0);
  const draggingRef = useRef(false);

  // 拖拽起点：记录 aside 左边缘，进入拖拽态并捕获指针
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    const aside = event.currentTarget.closest<HTMLElement>(
      "[data-slot='dual-sidebar']",
    );
    if (!aside) {
      return;
    }
    asideLeftRef.current = aside.getBoundingClientRect().left;
    draggingRef.current = true;
    setIsResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  // 拖拽中：用 clientX 减 aside 左边缘得到新宽度，钳制到 [MIN, MAX] 实时写入
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!draggingRef.current) {
      return;
    }
    const next = event.clientX - asideLeftRef.current;
    setWidth(Math.max(SIDEBAR_MIN_WIDTH, Math.min(next, SIDEBAR_MAX_WIDTH)));
  };

  // 拖拽结束：释放拖拽态与指针捕获
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (!draggingRef.current) {
      return;
    }
    draggingRef.current = false;
    setIsResizing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="拖拽调整侧边栏宽度"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={cn(
        "absolute inset-y-0 right-0 z-20 w-1 cursor-col-resize touch-none select-none",
        "bg-transparent transition-colors hover:bg-foreground/20",
      )}
    />
  );
}
