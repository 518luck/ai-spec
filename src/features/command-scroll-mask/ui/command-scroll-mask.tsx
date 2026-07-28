"use client";

// # CommandScrollMask：cmdk 列表专用底部渐变遮罩
// > 在 ScrollMask 基础上订阅 cmdk 搜索词，过滤收缩列表后主动 rAF 重算进度，消除遮罩闪烁
// ! 必须放在 <Command> 内部（依赖 useCommandState），通常与 CommandList 同级渲染

import { useCommandState } from "cmdk";
import { type JSX, useEffect } from "react";
import { ScrollMask } from "@/shared/ui/scroll-mask";

type CommandScrollMaskProps = {
	// 滚动进度（0~1），来自 useScrollProgress；1=到底时遮罩完全透明
	scrollProgress: number;
	// 滚动进度重算回调，通常传 useScrollProgress 返回的 updateScrollProgress
	onSearchChange: () => void;
	// 是否启用：内容不可滚动时传 false 整体不渲染
	enabled?: boolean;
	// 遮罩底色：Command/Popover 面板默认 popover，避免暗色主题下 background 与弹层色差导致弥散看不见
	maskColor?: string;
	className?: string;
};

// > cmdk 列表遮罩：订阅搜索词驱动 rAF 重算，跨过 cmdk 过滤后的 DOM 重排帧再读真实尺寸
export function CommandScrollMask({
	scrollProgress,
	onSearchChange,
	enabled = true,
	maskColor = "var(--popover)",
	className,
}: CommandScrollMaskProps): JSX.Element | null {
	const search = useCommandState((state) => state.search);

	// biome-ignore lint/correctness/useExhaustiveDependencies: search 作为 cmdk 过滤的触发信号，effect body 不读它但需响应其变化
	useEffect(() => {
		// 跨过 cmdk 过滤后的 DOM 重排帧再重算，拿到的是收缩后的真实尺寸
		const id = requestAnimationFrame(onSearchChange);
		return () => cancelAnimationFrame(id);
	}, [search, onSearchChange]);

	return (
		<ScrollMask
			scrollProgress={scrollProgress}
			enabled={enabled}
			maskColor={maskColor}
			className={className}
		/>
	);
}
