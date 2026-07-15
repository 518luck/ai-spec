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
				"pointer-events-auto absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-linear-to-t from-foreground/10 via-foreground/5 to-foreground/0 p-2 pt-2 backdrop-blur-[1px]",
				className,
			)}
		>
			{children}
		</div>
	);
}
