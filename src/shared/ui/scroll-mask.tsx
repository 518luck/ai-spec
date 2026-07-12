import { cn } from "@/shared/lib/utils";

type ScrollMaskProps = {
	// 滚动进度（0~1），通常来自 useScrollProgress；1=到底时遮罩完全透明
	scrollProgress: number;
	className?: string;
};

// # ScrollMask：可滚动容器底部渐变遮罩，滚到底自动淡出
// > 搭配 useScrollProgress 使用：hook 算进度，本组件根据进度算透明度
// > 用法：<ScrollMask scrollProgress={progress} /> 放在可滚动容器的相对定位父级里
export function ScrollMask({ scrollProgress, className }: ScrollMaskProps) {
	return (
		<div
			className={cn(
				"pointer-events-none absolute bottom-0 left-0 z-10 h-16 w-full bg-linear-to-t from-background to-transparent",
				className,
			)}
			style={{ opacity: 1 - scrollProgress ** 2 }}
		/>
	);
}
