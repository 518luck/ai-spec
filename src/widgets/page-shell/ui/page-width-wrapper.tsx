// # 页面宽度容器：最大宽度居中外壳，可选边框卡片与撑满模式

import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export function PageWidthWrapper({
	className,
	children,
	border = true,
	fill = false,
}: {
	className?: string;
	children: ReactNode;
	/** 是否渲染内容卡片边框（含配套的内边距），默认开启 */
	border?: boolean;
	/** 是否撑满父级剩余高度（表格等需要占满视口的场景），默认关闭 */
	fill?: boolean;
}) {
	return (
		<div
			className={cn(
				"@container/page mx-auto w-full px-3 pt-6 pb-6 lg:px-6",
				fill && "flex min-h-0 flex-1 flex-col",
				className,
			)}
		>
			<div
				className={cn(
					"rounded-lg border px-6 py-4",
					!border && "border-none px-0 py-0",
					fill && "flex min-h-0 flex-1 flex-col",
				)}
			>
				{children}
			</div>
		</div>
	);
}
