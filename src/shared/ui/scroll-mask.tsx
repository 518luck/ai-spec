import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";

type ScrollMaskDirection = "vertical" | "horizontal";

// 显示哪一侧：start=顶部/左侧，end=底部/右侧（默认），both=两侧都画
type ScrollMaskSides = "start" | "end" | "both";

// 箭头点击的侧：start=往左/上滚，end=往右/下滚
type ScrollMaskSide = "start" | "end";

type ScrollMaskProps = {
	// 滚动进度（0~1），通常来自 useScrollProgress；end 侧按 progress 平方衰减，start 侧按 progress>0 切换
	scrollProgress: number;
	// 是否启用：内容不可滚动时传 false 整体不渲染（避免 progress=1 被误判为「滚到底」而画出 start 侧遮罩）
	enabled?: boolean;
	// 渐变方向：vertical=纵向（默认，底部淡出），horizontal=横向（左右淡出）
	direction?: ScrollMaskDirection;
	// 显示哪一侧：默认 "end"（底部/右侧），chips 横向双侧淡出用 "both"
	sides?: ScrollMaskSides;
	// 传入则在能继续滚动的侧渲染箭头按钮，点击触发回调；不传则纯遮罩（默认）
	onArrowClick?: (side: ScrollMaskSide) => void;
	// 遮罩与箭头底色：默认 var(--background)；编辑器主题色场景传入对应主题色避免遮罩与背景不一致
	maskColor?: string;
	className?: string;
};

// # ScrollMask：可滚动容器边缘渐变遮罩，根据滚动位置自动淡出
// > 纵向单侧（默认）：放在 relative 父级底部，opacity 按 1 - progress² 平滑衰减
// > 横向双侧（direction=horizontal, sides=both）：左右两侧渐变，progress=0 隐藏左侧，progress=1 隐藏右侧
// > 传 onArrowClick 时额外在可滚动方向渲染箭头按钮（横向用左右 chevron，纵向用上下 chevron）
// > 搭配 useScrollProgress 使用：hook 算进度，本组件根据进度渲染遮罩
export function ScrollMask({
	scrollProgress,
	enabled = true,
	direction = "vertical",
	sides = "end",
	onArrowClick,
	maskColor = "var(--background)",
	className,
}: ScrollMaskProps): JSX.Element | null {
	// 内容不可滚动时整体不渲染（避免「progress=1 但实际没东西可滚」被误判）
	if (!enabled) return null;
	// end 侧（底部/右侧）：进度越大越透明，平方衰减更自然
	const endOpacity = 1 - scrollProgress ** 2;
	// start 侧（顶部/左侧）：已滚动（progress > 0）即显示，到边即隐藏
	const startOpacity = scrollProgress > 0 ? 1 : 0;

	const showStart = sides === "start" || sides === "both";
	const showEnd = sides === "end" || sides === "both";
	// 箭头只在能继续滚的方向出现：start 侧已滚动才出现，end 侧未到边才出现
	const showStartArrow = Boolean(onArrowClick) && scrollProgress > 0;
	const showEndArrow = Boolean(onArrowClick) && scrollProgress < 1;

	// > 遮罩渐变（start 侧）：从 maskColor 到透明，方向由 direction 决定
	const startGradient =
		direction === "vertical"
			? `linear-gradient(to bottom, ${maskColor}, transparent)`
			: `linear-gradient(to right, ${maskColor}, transparent)`;
	// > 遮罩渐变（end 侧）：从透明到 maskColor
	const endGradient =
		direction === "vertical"
			? `linear-gradient(to top, ${maskColor}, transparent)`
			: `linear-gradient(to left, ${maskColor}, transparent)`;

	return (
		<>
			{showStart && (
				<div
					className={cn(
						"pointer-events-none absolute z-10 transition-opacity",
						direction === "vertical" ? "inset-x-0 top-0 h-16" : "inset-y-0 left-0 w-6",
						className,
					)}
					style={{ opacity: startOpacity, backgroundImage: startGradient }}
				/>
			)}
			{showEnd && (
				<div
					className={cn(
						"pointer-events-none absolute z-10 transition-opacity",
						direction === "vertical" ? "inset-x-0 bottom-0 h-16" : "inset-y-0 right-0 w-6",
						className,
					)}
					style={{ opacity: endOpacity, backgroundImage: endGradient }}
				/>
			)}
			{/* // 悬停父级（需带 group 类）时浮现箭头，点击按一屏滚动；到边自动隐藏 */}
			{showStartArrow && (
				<button
					type="button"
					aria-label={direction === "vertical" ? "向上滚动" : "向左滚动"}
					onClick={() => onArrowClick?.("start")}
					className={cn(
						"absolute z-20 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition hover:bg-background group-hover:opacity-100",
						direction === "vertical"
							? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
							: "top-1/2 left-0 -translate-y-1/2",
					)}
				>
					{direction === "vertical" ? (
						<Icons.chevronUp className="size-4" />
					) : (
						<Icons.chevronLeft className="size-4" />
					)}
				</button>
			)}
			{showEndArrow && (
				<button
					type="button"
					aria-label={direction === "vertical" ? "向下滚动" : "向右滚动"}
					onClick={() => onArrowClick?.("end")}
					className={cn(
						"absolute z-20 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition hover:bg-background group-hover:opacity-100",
						direction === "vertical"
							? "bottom-0 left-1/2 -translate-x-1/2"
							: "top-1/2 right-0 -translate-y-1/2",
					)}
				>
					{direction === "vertical" ? (
						<Icons.chevronDown className="size-4" />
					) : (
						<Icons.chevronRight className="size-4" />
					)}
				</button>
			)}
		</>
	);
}
