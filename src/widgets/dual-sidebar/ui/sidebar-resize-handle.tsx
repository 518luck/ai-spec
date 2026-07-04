"use client";

import { type JSX, type PointerEvent, useRef } from "react";

import { cn } from "@/shared/lib/utils";
import { useDualSidebarContext } from "../model/dual-sidebar-context";
import {
  SIDEBAR_COLLAPSE_THRESHOLD,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "../model/sidebar-config";

// 侧边栏右边缘拖拽手柄：pointerdown 捕获指针，move 实时改宽并钳制到合法范围，up 释放
export function SidebarResizeHandle(): JSX.Element {
  const { setWidth, setCollapsed, setIsResizing } = useDualSidebarContext();
  // 拖拽起点记录的 aside 左边缘（clientX 减它即新宽度），以及拖拽进行中标记
  const asideLeftRef = useRef(0);
  const draggingRef = useRef(false);

  // 拖拽起点：记录 aside 左边缘，进入拖拽态并捕获指针
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    const aside = event.currentTarget.closest<HTMLElement>("[data-slot='dual-sidebar']");
    if (!aside) {
      return;
    }
    asideLeftRef.current = aside.getBoundingClientRect().left;
    draggingRef.current = true;
    setIsResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  // 拖拽中：钳制宽度后按阈值吸附——< 阈值进紧凑（冻结 width 保留记忆值），≥ 阈值展开并存宽度
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!draggingRef.current) {
      return;
    }
    const next = Math.max(
      SIDEBAR_MIN_WIDTH,
      Math.min(event.clientX - asideLeftRef.current, SIDEBAR_MAX_WIDTH),
    );
    if (next < SIDEBAR_COLLAPSE_THRESHOLD) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
      setWidth(next);
    }
  };

  // 统一结束拖拽：清除拖拽标记与 isResizing，释放指针捕获
  const endDrag = (event: PointerEvent<HTMLDivElement>): void => {
    if (!draggingRef.current) {
      return;
    }
    draggingRef.current = false;
    setIsResizing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  // 拖拽结束：松手
  const handlePointerUp = endDrag;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="拖拽调整侧边栏宽度"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      className={cn(
        "absolute inset-y-2 right-2 z-20 w-1 cursor-col-resize touch-none select-none rounded-r-xl",
        "bg-transparent transition-colors hover:bg-foreground/20",
      )}
    />
  );
}
