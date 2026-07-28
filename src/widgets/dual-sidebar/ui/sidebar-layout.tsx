// # 双栏侧边栏布局：服务端读 cookie 还原宽度/折叠态，装配 Provider 与主内容区

import { cookies } from "next/headers";
import type { ComponentProps, JSX } from "react";

import { cn } from "@/shared/lib/utils";
import {
	SIDEBAR_COLLAPSED_COOKIE,
	SIDEBAR_DEFAULT_WIDTH,
	SIDEBAR_WIDTH_COOKIE,
} from "../model/config";
import { SidebarProvider } from "../model/sidebar-context";
import { sidebarZoneClasses } from "../model/sidebar-styles";
import { Sidebar } from "./sidebar";
import { SidebarContent } from "./sidebar-content";

type SidebarLayoutProps = ComponentProps<"div"> & {
	sidebarClassName?: string;
	contentClassName?: string;
};

export async function SidebarLayout({
	className,
	sidebarClassName,
	contentClassName,
	children,
	...props
}: SidebarLayoutProps): Promise<JSX.Element> {
	// 服务端读取 cookie，把用户上次的宽度与折叠状态作为 SSR 默认值，避免首屏闪烁
	const cookieStore = await cookies();
	const widthRaw = cookieStore.get(SIDEBAR_WIDTH_COOKIE)?.value;
	const collapsedRaw = cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value;
	const defaultWidth = widthRaw
		? Number.parseInt(widthRaw, 10) || SIDEBAR_DEFAULT_WIDTH
		: SIDEBAR_DEFAULT_WIDTH;
	const defaultCollapsed = collapsedRaw === "true";

	return (
		<SidebarProvider defaultWidth={defaultWidth} defaultCollapsed={defaultCollapsed}>
			<div
				data-slot="dual-sidebar-layout"
				className={cn(
					sidebarZoneClasses.layout.shell,
					"flex h-dvh w-full overflow-hidden",
					className,
				)}
				{...props}
			>
				<Sidebar className={sidebarClassName} />

				<SidebarContent className={contentClassName}>{children}</SidebarContent>
			</div>
		</SidebarProvider>
	);
}
