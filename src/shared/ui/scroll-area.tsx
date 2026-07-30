"use client";

// # ScrollArea 滚动区域（基于 base-ui）：仅用于需自绘滚动条的固定高度产品面板（页壳 / 预览对齐）

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import type { Ref } from "react";

import { cn } from "@/shared/lib/utils";

function ScrollArea({
	className,
	children,
	orientation = "vertical",
	scrollbarClassName,
	thumbSmooth = false,
	viewportRef,
	...props
}: ScrollAreaPrimitive.Root.Props & {
	/** 滚动方向：vertical（默认，竖向）或 horizontal（横向） */
	orientation?: "vertical" | "horizontal";
	/** 滚动条的自定义样式（如圆角内缩 margin） */
	scrollbarClassName?: string;
	/**
	 * 滚动条 thumb 在内容高度突变时是否平滑过渡。
	 * base-ui 通过 ResizeObserver 监听内容尺寸变化并重算 thumb 位置（非每帧覆盖），
	 * 所以内容突变时给 thumb 加 CSS transition，浏览器会自动平滑插值 transform 变化。
	 * 仅在内容突变时由调用方短暂启用，避免正常滚动时 thumb 拖影。
	 */
	thumbSmooth?: boolean;
	/** 透传给内部 viewport，供回顶按钮等读取真实滚动容器 */
	viewportRef?: Ref<HTMLDivElement>;
}) {
	return (
		<ScrollAreaPrimitive.Root
			data-slot="scroll-area"
			className={cn("relative", className)}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				ref={viewportRef}
				data-slot="scroll-area-viewport"
				className={cn(
					"rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50",
					orientation === "vertical" ? "max-h-[inherit] w-full" : "h-full max-w-[inherit]",
				)}
			>
				{children}
			</ScrollAreaPrimitive.Viewport>
			<ScrollBar
				orientation={orientation}
				className={scrollbarClassName}
				thumbSmooth={thumbSmooth}
			/>
			<ScrollAreaPrimitive.Corner />
		</ScrollAreaPrimitive.Root>
	);
}

function ScrollBar({
	className,
	orientation = "vertical",
	thumbSmooth = false,
	...props
}: ScrollAreaPrimitive.Scrollbar.Props & {
	/** 滚动条 thumb 在内容高度突变时是否平滑过渡 */
	thumbSmooth?: boolean;
}) {
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
				// thumbSmooth 开启时给 thumb 打上 data-smooth 标记；base-ui ResizeObserver 触发重算时，
				// 浏览器监听到 transform 值变化会自动播放 transition，实现 thumb 平滑过渡
				data-smooth={thumbSmooth || undefined}
				className={cn(
					"relative flex-1 rounded-full bg-border",
					// data-smooth 存在时启用 transform 过渡，时长与缓动让 thumb 收缩更自然
					"data-smooth:transition-transform data-smooth:duration-500 data-smooth:ease-out",
				)}
			/>
		</ScrollAreaPrimitive.Scrollbar>
	);
}

export { ScrollArea, ScrollBar };
