"use client";

// # 带工具栏的页面外壳：标题栏（标题+提示+筛选器）+ 右侧操作区 + 可滚动内容区

import type { JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type ToolbarPageShellProps = {
	title: ReactNode; // 页面标题，可传字符串或带图标的 ReactNode
	help?: ReactNode; // 标题旁的提示内容，由父组件决定渲染什么
	filter?: ReactNode; // 标题区的筛选器，如文件夹选择下拉
	actions?: ReactNode; // 右上角操作区，如"新建"按钮
	children: ReactNode; // 内容区
	className?: string; // 透传给最外层 div 的 className
};

// 提供标题栏和可滚动内容区的页面外壳，内容宽度由调用方自行控制。
export function ToolbarPageShell({
	title,
	help,
	filter,
	actions,
	children,
	className,
}: ToolbarPageShellProps): JSX.Element {
	return (
		<div
			data-slot="toolbar-page-shell"
			className={cn("flex h-full min-h-0 flex-col overflow-auto", className)}
		>
			{/* 标题栏：吸顶在滚动容器顶部，透明背景让内容可从下方穿过 */}
			<div className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-transparent px-6">
				{typeof title === "string" ? (
					<div className="flex items-center gap-1.5">
						<h1 className="font-semibold text-lg leading-tight">{title}</h1>
						{help}
						{filter}
					</div>
				) : (
					title
				)}
				{actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
			</div>

			{/* 内容区：占满剩余高度，宽度限制与滚动交给调用方 */}
			<div className="flex min-h-0 flex-1 flex-col">{children}</div>
		</div>
	);
}
