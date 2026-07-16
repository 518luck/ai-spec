"use client";

// # 带工具栏的页面外壳：标题栏（标题+提示+筛选器）+ 右侧操作区 + 可滚动内容区

import type { JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { PageWidthWrapper } from "./page-width-wrapper";

type ToolbarPageShellProps = {
	title: ReactNode; // 页面标题，可传字符串或带图标的 ReactNode
	help?: ReactNode; // 标题旁的提示内容，由父组件决定渲染什么
	filter?: ReactNode; // 标题区的筛选器，如文件夹选择下拉
	actions?: ReactNode; // 右上角操作区，如"新建"按钮
	children: ReactNode; // 内容区
	className?: string; // 透传给最外层 div 的 className
};

export function ToolbarPageShell({
	title,
	help,
	filter,
	actions,
	children,
	className,
}: ToolbarPageShellProps): JSX.Element {
	return (
		<div data-slot="toolbar-page-shell" className={cn("flex h-full min-h-0 flex-col", className)}>
			{/* 标题栏：左侧标题区（标题+提示+筛选器） + 右侧操作区 */}
			<div className="flex h-16 shrink-0 items-center border-b px-6">
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

			{/* 内容区：可滚动，由 PageWidthWrapper 限制最大宽度并居中 */}
			<PageWidthWrapper border={false} fill>
				{children}
			</PageWidthWrapper>
		</div>
	);
}
