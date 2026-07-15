import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type HoverOverlayProps = {
	children: ReactNode;
	className?: string;
};

// # HoverOverlay：卡片底部渐变遮罩，hover 时淡入显示操作按钮
// > 父容器需加 group 和 relative；本组件靠 group-hover 触发显隐
export function HoverOverlay({ children, className }: HoverOverlayProps): ReactNode {
	return (
		<div
			className={cn(
				// ! 调试用红色背景，确认效果后改回 from-card via-card/95 to-card/0
				"pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-red-500 via-red-500/95 to-red-500/0 p-3 pt-4 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100",
				className,
			)}
		>
			{children}
		</div>
	);
}
