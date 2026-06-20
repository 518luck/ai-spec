"use client";

import {
  createContext,
  type JSX,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";

type DualSidebarContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
};

type DualSidebarProviderProps = PropsWithChildren<{
  defaultOpen?: boolean;
}>;

const DualSidebarContext = createContext<DualSidebarContextType | null>(null);

// 提供双栏侧边栏展开状态，供布局内组件协同控制操作栏。
export function DualSidebarProvider({
  children,
  defaultOpen = true,
}: DualSidebarProviderProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  // 展开右侧操作导航栏。
  const openSidebar = (): void => {
    setOpen(true);
  };

  // 关闭右侧操作导航栏，仅保留左侧业务图标栏。
  const closeSidebar = (): void => {
    setOpen(false);
  };

  // 在展开和关闭状态之间切换右侧操作导航栏。
  const toggleSidebar = (): void => {
    setOpen((currentOpen) => !currentOpen);
  };

  return (
    <DualSidebarContext.Provider
      value={{
        open,
        setOpen,
        openSidebar,
        closeSidebar,
        toggleSidebar,
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
