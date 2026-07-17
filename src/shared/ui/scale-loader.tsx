"use client";

// # 缩放竖条加载动画：薄包装 react-spinners 的 ScaleLoader，屏蔽 color prop，颜色改由父元素文字色控制（暗色模式兼容）

import { ScaleLoader } from "react-spinners";
import { cn } from "@/shared/lib/utils";

// 原生 color prop 被屏蔽，颜色统一走 currentColor（由父元素 text-* 控制），避免硬编码黑色在暗色模式不可见
type ScaleLoaderWrapProps = {
	loading?: boolean;
	height?: number | string;
	width?: number | string;
	radius?: number | string;
	margin?: number | string;
	speedMultiplier?: number;
	barCount?: number;
	className?: string;
};

// 缩放竖条加载动画，默认值与 react-spinners 官方一致（height=35, width=4, barCount=5）
function ScaleLoaderWrap({
	loading = true,
	height = 35,
	width = 4,
	radius = 2,
	margin = 2,
	speedMultiplier = 1,
	barCount = 5,
	className,
}: ScaleLoaderWrapProps) {
	return (
		<ScaleLoader
			loading={loading}
			color="currentColor"
			height={height}
			width={width}
			radius={radius}
			margin={margin}
			speedMultiplier={speedMultiplier}
			barCount={barCount}
			cssOverride={{ display: "inline-block" }}
			className={cn(className)}
		/>
	);
}

export { ScaleLoaderWrap };
