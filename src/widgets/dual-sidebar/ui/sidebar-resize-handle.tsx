"use client";

import { type JSX, type KeyboardEvent, type PointerEvent, useRef } from "react";

import { cn } from "@/shared/lib/utils";
import { useDualSidebarContext } from "../model/dual-sidebar-context";
import {
	SIDEBAR_COLLAPSE_THRESHOLD,
	SIDEBAR_MAX_WIDTH,
	SIDEBAR_MIN_WIDTH,
} from "../model/sidebar-config";

// 键盘单次 ←→ 调整宽度的步长（px），与鼠标拖拽同样进入折叠阈值判定
const KEYBOARD_STEP = 8;

// 侧边栏右边缘拖拽手柄：pointerdown 捕获指针，move 实时改宽并钳制到合法范围，up 释放
// 支持 splitter 角色：鼠标拖拽 + 键盘 ←→ 双模式，aria-valuenow/min/max 完整暴露给 AT
export function SidebarResizeHandle(): JSX.Element {
	const { width, setWidth, setCollapsed, setIsResizing } = useDualSidebarContext();
	// 拖拽起点记录的 aside 左边缘（clientX 减它即新宽度），以及拖拽进行中标记
	const asideLeftRef = useRef(0);
	const draggingRef = useRef(false);

	// 应用新宽度并按折叠阈值吸附：< 阈值进紧凑（冻结 width 保留记忆值），≥ 阈值展开并存宽度
	const applyWidth = (next: number): void => {
		const clamped = Math.max(SIDEBAR_MIN_WIDTH, Math.min(next, SIDEBAR_MAX_WIDTH));
		if (clamped < SIDEBAR_COLLAPSE_THRESHOLD) {
			setCollapsed(true);
		} else {
			setCollapsed(false);
			setWidth(clamped);
		}
	};

	// 拖拽起点：记录 aside 左边缘，进入拖拽态并捕获指针
	const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
		const aside = event.currentTarget.closest<HTMLElement>("[data-slot='dual-sidebar']");
		if (!aside) {
			return;
		}
		asideLeftRef.current = aside.getBoundingClientRect().left;
		draggingRef.current = true;
		setIsResizing(true);
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	// 拖拽中：按鼠标 clientX 推算新宽度，沿用 applyWidth 的吸附逻辑
	const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
		if (!draggingRef.current) {
			return;
		}
		applyWidth(event.clientX - asideLeftRef.current);
	};

	// 统一结束拖拽：清除拖拽标记与 isResizing，释放指针捕获
	const endDrag = (event: PointerEvent<HTMLDivElement>): void => {
		if (!draggingRef.current) {
			return;
		}
		draggingRef.current = false;
		setIsResizing(false);
		event.currentTarget.releasePointerCapture(event.pointerId);
	};

	// 拖拽结束：松手
	const handlePointerUp = endDrag;

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
		// 用 div + role=separator 实现 splitter：鼠标 pointer 拖拽 + 键盘 ←→ 双模式。
		// 不用 <hr> 是因为浏览器对 <hr> 的 pointer 事件有特殊处理，setPointerCapture 会失效导致拖不动。
		// biome-ignore lint/a11y/useSemanticElements: W3C splitter 模式要求 role=separator(ARIA 1.1 focusable widget),<hr> 无法满足拖拽+键盘+aria-valuenow
		<div
			role="separator"
			tabIndex={0}
			aria-orientation="vertical"
			aria-label="拖拽调整侧边栏宽度"
			aria-valuenow={width}
			aria-valuemin={SIDEBAR_MIN_WIDTH}
			aria-valuemax={SIDEBAR_MAX_WIDTH}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={endDrag}
			onLostPointerCapture={endDrag}
			onKeyDown={handleKeyDown}
			className={cn(
				"absolute inset-y-2 right-2 z-20 w-1 cursor-col-resize touch-none select-none rounded-r-xl",
				"bg-transparent transition-colors hover:bg-foreground/20",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			)}
		/>
	);
}
