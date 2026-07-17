"use client";

// # 带工具栏的页面外壳：标题栏（标题+提示+筛选器）+ 右侧操作区 + 可滚动内容区

import type { JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/ui/scroll-area";

type ToolbarPageShellProps = {
	title: ReactNode; // 页面标题，可传字符串或带图标的 ReactNode
	help?: ReactNode; // 标题旁的提示内容，由父组件决定渲染什么
	filter?: ReactNode; // 标题区的筛选器，如文件夹选择下拉
	search?: ReactNode; // 标题栏中间的搜索区，水平居中显示
	actions?: ReactNode; // 右上角操作区，如"新建"按钮
	children: ReactNode; // 内容区
	className?: string; // 透传给最外层容器的 className
};

// 提供标题栏和可滚动内容区的页面外壳，内容宽度由调用方自行控制。
export function ToolbarPageShell({
	title,
	help,
	filter,
	search,
	actions,
	children,
	className,
}: ToolbarPageShellProps): JSX.Element {
	return (
		<div data-slot="toolbar-page-shell" className={cn("flex h-full min-h-0 flex-col", className)}>
			<ScrollArea
				className="h-full max-h-full"
				// 滚动条从标题栏下方开始，避免穿过标题栏区域；
				scrollbarClassName="!top-16 data-[orientation=vertical]:!h-[calc(100%-4rem)]"
			>
				{/* 标题栏：吸顶在 ScrollArea viewport 顶部，透明背景让内容可从下方穿过 */}
				{/* > 三段式布局：左侧 title+filter | 中间 search 居中 | 右侧 actions；用 gap-4 控制各段间距，search 用 mx-auto 水平居中 */}
				<div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-linear-to-b from-background/80 to-background/5 px-6 backdrop-blur-sm">
					{/* 左侧：标题 + 帮助 + 文件夹筛选 */}
					<div className="flex shrink-0 items-center gap-1.5">
						{typeof title === "string" ? (
							<>
								<h1 className="font-semibold text-lg leading-tight">{title}</h1>
								{help}
							</>
						) : (
							title
						)}
						{filter}
					</div>
					{/* 中间：搜索区，mx-auto 让它在剩余空间水平居中 */}
					{search ? <div className="mx-auto">{search}</div> : null}
					{/* 右侧：操作区 */}
					{actions ? (
						<div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>
					) : null}
				</div>

				{children}
			</ScrollArea>
		</div>
	);
}
