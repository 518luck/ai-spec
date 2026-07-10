import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export function PageWidthWrapper({
	className,
	children,
	border = true,
}: {
	className?: string;
	children: ReactNode;
	/** 是否渲染内容卡片边框（含配套的内边距），默认开启 */
	border?: boolean;
}) {
	return (
		<div className={cn("@container/page mx-auto w-full max-w-7xl px-3 pt-6 lg:px-6", className)}>
			<div className={cn("rounded-lg border px-6 py-4", !border && "border-none px-0 py-0")}>
				{children}
			</div>
		</div>
	);
}
