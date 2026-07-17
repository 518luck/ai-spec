"use client";

// # 双栏侧边栏 Context：共享 aside 宽度、紧凑模式、拖拽态与导航过渡状态

import { useRouter } from "next/navigation";
import {
	createContext,
	type JSX,
	type PropsWithChildren,
	useContext,
	useState,
	useTransition,
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
	// 路由导航过渡：点击侧边栏链接后到新页面渲染完成前为 true
	isPending: boolean;
	// 触发导航；用 startTransition 包裹 router.push，使 isPending 在 RSC 传输期间保持为 true
	navigate: (href: string) => void;
};

type DualSidebarProviderProps = PropsWithChildren<{
	defaultWidth?: number;
	defaultCollapsed?: boolean;
}>;

const DualSidebarContext = createContext<DualSidebarContextType | null>(null);

// 提供双栏侧边栏共享状态：aside 宽度、紧凑模式、拖拽态与导航过渡态
export function DualSidebarProvider({
	children,
	defaultWidth = SIDEBAR_DEFAULT_WIDTH,
	defaultCollapsed = false,
}: DualSidebarProviderProps): JSX.Element {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const [width, setWidthState] = useState(defaultWidth);
	const [collapsed, setCollapsedState] = useState(defaultCollapsed);
	const [isResizing, setIsResizing] = useState(false);

	const setWidth = (nextWidth: number): void => {
		setWidthState(nextWidth);
		saveSidebarWidth(nextWidth);
	};

	const resetWidth = (): void => {
		setWidthState(SIDEBAR_DEFAULT_WIDTH);
		saveSidebarWidth(SIDEBAR_DEFAULT_WIDTH);
	};

	const setCollapsed = (nextCollapsed: boolean): void => {
		setCollapsedState(nextCollapsed);
		saveSidebarCollapsed(nextCollapsed);
	};

	const toggleCollapsed = (): void => {
		setCollapsed(!collapsed);
	};

	// 触发客户端导航：startTransition 使 isPending 在 RSC 传输期间保持 true，让 layout 层显示 loading
	const navigate = (href: string): void => {
		startTransition(() => {
			router.push(href);
		});
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
				isPending,
				navigate,
			}}
		>
			{children}
		</DualSidebarContext.Provider>
	);
}

// ! 必须在 DualSidebarProvider 组件内部使用，否则抛错
export const useDualSidebarContext = (): DualSidebarContextType => {
	const context = useContext(DualSidebarContext);

	if (context === null) {
		throw new Error("useDualSidebarContext 必须在 DualSidebarProvider 组件内部使用。");
	}

	return context;
};
