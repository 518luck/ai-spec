"use client";

import {
  createContext,
  type JSX,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";

import { SIDEBAR_DEFAULT_WIDTH } from "./sidebar-config";
import { saveSidebarCollapsed, saveSidebarWidth } from "./sidebar-persistence";

type DualSidebarContextType = {
  // aside 当前展开宽度（px），紧凑态下不直接使用
  width: number;
  setWidth: (width: number) => void;
  // 恢复默认展开宽度（清掉用户拖拽后的自定义宽度）
  resetWidth: () => void;
  // 紧凑模式（一级留图标、二级留点）
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  // 拖拽中标记：供 aside 关闭宽度过渡动画，避免拖拽滞后（瞬时态，不持久化）
  isResizing: boolean;
  setIsResizing: (isResizing: boolean) => void;
};

type DualSidebarProviderProps = PropsWithChildren<{
  defaultWidth?: number;
  defaultCollapsed?: boolean;
}>;

const DualSidebarContext = createContext<DualSidebarContextType | null>(null);

// 提供双栏侧边栏共享状态：aside 宽度与紧凑模式，并同步持久化到 cookie
export function DualSidebarProvider({
  children,
  defaultWidth = SIDEBAR_DEFAULT_WIDTH,
  defaultCollapsed = false,
}: DualSidebarProviderProps): JSX.Element {
  const [width, setWidthState] = useState(defaultWidth);
  const [collapsed, setCollapsedState] = useState(defaultCollapsed);
  const [isResizing, setIsResizing] = useState(false);

  // 设置 aside 宽度并持久化（拖拽过程高频调用，写入内部已节流）
  const setWidth = (nextWidth: number): void => {
    setWidthState(nextWidth);
    saveSidebarWidth(nextWidth);
  };

  // 恢复默认展开宽度，用于重置按钮
  const resetWidth = (): void => {
    setWidthState(SIDEBAR_DEFAULT_WIDTH);
    saveSidebarWidth(SIDEBAR_DEFAULT_WIDTH);
  };

  // 设置紧凑模式并持久化
  const setCollapsed = (nextCollapsed: boolean): void => {
    setCollapsedState(nextCollapsed);
    saveSidebarCollapsed(nextCollapsed);
  };

  // 在展开与紧凑模式之间切换
  const toggleCollapsed = (): void => {
    setCollapsed(!collapsed);
  };

  return (
    <DualSidebarContext.Provider
      value={{
        width,
        setWidth,
        resetWidth,
        collapsed,
        setCollapsed,
        toggleCollapsed,
        isResizing,
        setIsResizing,
      }}
    >
      {children}
    </DualSidebarContext.Provider>
  );
}

// 读取双栏侧边栏共享状态并保证调用位置正确。
export const useDualSidebarContext = (): DualSidebarContextType => {
  const context = useContext(DualSidebarContext);

  if (context === null) {
    throw new Error(
      "useDualSidebarContext 必须在 DualSidebarProvider 组件内部使用。",
    );
  }

  return context;
};
