"use client";

// # 双栏侧边栏主内容区壳层：读取导航过渡态，切换期间显示加载动画

import type { ComponentProps, JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { useDualSidebarContext } from "../model/dual-sidebar-context";
import { dualSidebarZoneClasses } from "../model/dual-sidebar-styles";

// 渲染双栏布局主内容区壳层；isPending 时显示加载动画，覆盖内容区直到新页面渲染完成
export function DualSidebarContent({
	className,
	children,
	...props
}: ComponentProps<"main">): JSX.Element {
	const { isPending } = useDualSidebarContext();

	return (
		<main
			data-slot="dual-sidebar-layout-content"
			className={cn(dualSidebarZoneClasses.content.shell, "flex min-w-0 flex-1 py-2", className)}
			{...props}
		>
			<div
				data-slot="dual-sidebar-layout-content-inner"
				className={cn(
					dualSidebarZoneClasses.content.surface,
					// ! relative 是关键：作为 CenteredLoader(absolute inset-0)和 isPending loader 的共同锚点，保证两者位置完全重合。去掉会导致 loader 跑位
					"relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl",
				)}
			>
				{isPending ? (
					<div className="flex flex-1 items-center justify-center text-muted-foreground">
						<ScaleLoaderWrap />
					</div>
				) : (
					children
				)}
			</div>
		</main>
	);
}
