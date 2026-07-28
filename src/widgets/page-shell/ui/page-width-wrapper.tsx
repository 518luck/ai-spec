// # 页面宽度容器：最大宽度居中外壳，可选撑满模式

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export function PageWidthWrapper({
	className,
	children,
	fill = false,
}: {
	className?: string;
	children: ReactNode;
	/** 是否撑满父级剩余高度（表格等需要占满视口的场景），默认关闭 */
	fill?: boolean;
}) {
	// fill 模式下整个容器用 flex 链保证高度传递，padding 直接放外层（不再套内层 div 隔离）
	return (
		<div
			className={cn(
				"@container/page mx-auto w-full px-3 pt-6 pb-6 lg:px-6",
				fill && "flex min-h-0 flex-1 flex-col",
				className,
			)}
		>
			{children}
		</div>
	);
}
