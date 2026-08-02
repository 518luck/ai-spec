"use client";

// # 项目详情侧栏缩放手柄：鼠标拖拽调整左侧文件夹树宽度（VSCode 风格），键盘 ←→ 双模式

import { type JSX, type KeyboardEvent, type PointerEvent, useRef } from "react";

import { cn } from "@/shared/lib/utils";

// 侧栏宽度边界（px）：与全局侧边栏的感官一致，防拖到不可用
export const SIDEBAR_MIN_WIDTH = 160;
export const SIDEBAR_MAX_WIDTH = 480;

// 键盘单次 ←→ 调整宽度的步长（px）
const KEYBOARD_STEP = 8;

type SidebarResizeHandleProps = {
	/** 当前侧栏宽度（px），由父级持有状态 */
	width: number;
	/** 应用新宽度（父级负责 clamp 与持久化） */
	onWidthChange: (width: number) => void;
};

// > 拖拽手柄：pointer capture 全程跟踪，松手才释放；参照全局 dual-sidebar 的 SidebarResizeHandle 模式
export function SidebarResizeHandle({
	width,
	onWidthChange,
}: SidebarResizeHandleProps): JSX.Element {
	// 拖拽起点记录的 aside 左边缘（clientX 减它即新宽度），以及拖拽进行中标记
	const asideLeftRef = useRef(0);
	const draggingRef = useRef(false);

	// 应用新宽度：clamp 到边界后交给父级
	const applyWidth = (next: number): void => {
		onWidthChange(Math.max(SIDEBAR_MIN_WIDTH, Math.min(next, SIDEBAR_MAX_WIDTH)));
	};

	// 拖拽起点：记录 aside 左边缘，进入拖拽态并捕获指针
	const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
		const aside = event.currentTarget.closest<HTMLElement>("[data-slot='detail-sidebar']");
		if (!aside) {
			return;
		}
		asideLeftRef.current = aside.getBoundingClientRect().left;
		draggingRef.current = true;
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	// 拖拽中：按鼠标 clientX 推算新宽度
	const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
		if (!draggingRef.current) {
			return;
		}
		applyWidth(event.clientX - asideLeftRef.current);
	};

	// 统一结束拖拽：清除拖拽标记，释放指针捕获
	const endDrag = (event: PointerEvent<HTMLDivElement>): void => {
		if (!draggingRef.current) {
			return;
		}
		draggingRef.current = false;
		event.currentTarget.releasePointerCapture(event.pointerId);
	};

	// 键盘可达：聚焦后按 ← → 调整宽度，让 splitter 角色对 AT 用户真实可用
	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (event.key === "ArrowLeft") {
			applyWidth(width - KEYBOARD_STEP);
		} else if (event.key === "ArrowRight") {
			applyWidth(width + KEYBOARD_STEP);
		} else {
			return;
		}
		event.preventDefault();
	};

	return (
		// ! 用 div + role=separator 实现 splitter，不能用 <hr>：浏览器对 <hr> 的 pointer 事件特殊处理会让 setPointerCapture 失效导致拖不动
		// biome-ignore lint/a11y/useSemanticElements: W3C splitter 模式要求 role=separator(ARIA 1.1 focusable widget),<hr> 无法满足拖拽+键盘+aria-valuenow
		<div
			role="separator"
			tabIndex={0}
			aria-orientation="vertical"
			aria-label="拖拽调整文件夹树宽度"
			aria-valuenow={width}
			aria-valuemin={SIDEBAR_MIN_WIDTH}
			aria-valuemax={SIDEBAR_MAX_WIDTH}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onLostPointerCapture={endDrag}
			onKeyDown={handleKeyDown}
			className={cn(
				"absolute inset-y-0 right-0 z-20 w-1 cursor-col-resize touch-none select-none",
				"bg-transparent transition-colors hover:bg-foreground/20",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			)}
		/>
	);
}
