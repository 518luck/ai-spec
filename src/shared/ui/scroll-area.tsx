"use client";

// # ScrollArea 滚动区域（基于 base-ui）：自定义滚动条样式，hover/滚动时淡入、移出自动隐藏

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "@/shared/lib/utils";

function ScrollArea({
	className,
	children,
	orientation = "vertical",
	scrollbarClassName,
	...props
}: ScrollAreaPrimitive.Root.Props & {
	/** 滚动方向：vertical（默认，竖向）或 horizontal（横向） */
	orientation?: "vertical" | "horizontal";
	/** 滚动条的自定义样式（如圆角内缩 margin） */
	scrollbarClassName?: string;
}) {
	return (
		<ScrollAreaPrimitive.Root
			data-slot="scroll-area"
			className={cn("relative", className)}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				data-slot="scroll-area-viewport"
				className={cn(
					"rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50",
					orientation === "vertical" ? "max-h-[inherit] w-full" : "h-full max-w-[inherit]",
				)}
			>
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar orientation={orientation} className={scrollbarClassName} />
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	);
}

function ScrollBar({
	className,
	orientation = "vertical",
	...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
	return (
		<ScrollAreaPrimitive.Scrollbar
			data-slot="scroll-area-scrollbar"
			data-orientation={orientation}
			orientation={orientation}
			// 滚动条默认隐藏（opacity-0），鼠标进入滚动区域（data-hovering）或正在滚动
			// （data-scrolling）时淡入显示，鼠标移出自动隐藏。
			className={cn(
				"flex touch-none select-none p-px opacity-0 transition-opacity duration-200",
				"data-hovering:opacity-100 data-scrolling:opacity-100",
				"data-horizontal:h-2.5 data-vertical:h-full data-vertical:w-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:border-l data-vertical:border-l-transparent",
				className,
			)}
			{...props}
		>
			<ScrollAreaPrimitive.Thumb
				data-slot="scroll-area-thumb"
				className="relative flex-1 rounded-full bg-border"
			/>
		</ScrollAreaPrimitive.Scrollbar>
	);
}

export { ScrollArea, ScrollBar };
