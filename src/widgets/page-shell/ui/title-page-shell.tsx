// # 带标题栏的页面外壳：可选标题 + 可滚动内容区

import type { ComponentProps, JSX, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/ui/scroll-area";

type TitlePageShellProps = Omit<ComponentProps<"div">, "title"> & {
	title?: ReactNode; // 页面标题，可传字符串或带图标的 ReactNode
};

// 提供可选标题栏和可滚动内容区的页面外壳，标题栏 sticky 吸顶，滚动时内容穿过其后方产生毛玻璃。
export function TitlePageShell({
	title,
	className,
	children,
	...props
}: TitlePageShellProps): JSX.Element {
	const headerContent = title ? (
		typeof title === "string" ? (
			<h1 className="font-semibold text-lg leading-tight">{title}</h1>
		) : (
			title
		)
	) : null;

	return (
		<div
			data-slot="title-page-shell"
			className={cn("flex h-full min-h-0 flex-col", className)}
			{...props}
		>
			<ScrollArea
				className="h-full max-h-full"
				// 滚动条从标题栏下方开始，避免穿过标题栏区域
				scrollbarClassName="!top-16 data-[orientation=vertical]:!h-[calc(100%-4rem)]"
			>
				{headerContent ? (
					<div
						data-slot="title-page-shell-header"
						className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-linear-to-b from-background/80 to-background/5 px-6 backdrop-blur-sm"
					>
						{headerContent}
					</div>
				) : null}
				{children}
			</ScrollArea>
		</div>
	);
}
