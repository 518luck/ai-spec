import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";

type ScrollMaskDirection = "vertical" | "horizontal";

// 显示哪一侧：start=顶部/左侧，end=底部/右侧（默认），both=两侧都画
type ScrollMaskSides = "start" | "end" | "both";

type ScrollMaskProps = {
	// 滚动进度（0~1），通常来自 useScrollProgress；end 侧按 progress 平方衰减，start 侧按 progress>0 切换
	scrollProgress: number;
	// 渐变方向：vertical=纵向（默认，底部淡出），horizontal=横向（左右淡出）
	direction?: ScrollMaskDirection;
	// 显示哪一侧：默认 "end"（底部/右侧），chips 横向双侧淡出用 "both"
	sides?: ScrollMaskSides;
	className?: string;
};

// # ScrollMask：可滚动容器边缘渐变遮罩，根据滚动位置自动淡出
// > 纵向单侧（默认）：放在 relative 父级底部，opacity 按 1 - progress² 平滑衰减
// > 横向双侧（direction=horizontal, sides=both）：左右两侧渐变，progress=0 隐藏左侧，progress=1 隐藏右侧
// > 搭配 useScrollProgress 使用：hook 算进度，本组件根据进度渲染遮罩
export function ScrollMask({
	scrollProgress,
	direction = "vertical",
	sides = "end",
	className,
}: ScrollMaskProps): JSX.Element {
	// end 侧（底部/右侧）：进度越大越透明，平方衰减更自然
	const endOpacity = 1 - scrollProgress ** 2;
	// start 侧（顶部/左侧）：已滚动（progress > 0）即显示，到边即隐藏
	const startOpacity = scrollProgress > 0 ? 1 : 0;

	const showStart = sides === "start" || sides === "both";
	const showEnd = sides === "end" || sides === "both";

	return (
		<>
			{showStart && (
				<div
					className={cn(
						"pointer-events-none absolute z-10 transition-opacity",
						direction === "vertical"
							? "inset-x-0 top-0 h-16 bg-linear-to-b from-background to-transparent"
							: "inset-y-0 left-0 w-6 bg-linear-to-r from-background to-transparent",
						className,
					)}
					style={{ opacity: startOpacity }}
				/>
			)}
			{showEnd && (
				<div
					className={cn(
						"pointer-events-none absolute z-10 transition-opacity",
						direction === "vertical"
							? "inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent"
							: "inset-y-0 right-0 w-6 bg-linear-to-l from-background to-transparent",
						className,
					)}
					style={{ opacity: endOpacity }}
				/>
			)}
		</>
	);
}
