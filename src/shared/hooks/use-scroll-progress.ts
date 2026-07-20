// # useScrollProgress：监听可滚动容器，返回当前滚动进度（0~1）与是否可滚动
// > 0=最顶部/最左侧，1=已到底/到最右；内容不足以滚动时 scrollProgress 返回 1，scrollable 返回 false
// > 用途：遮罩透明度、阅读进度条、懒加载判断
// > 搭配 ScrollMask 组件使用：本 hook 算进度和可滚动状态，ScrollMask 根据这些渲染遮罩
// > 容器尺寸变化时配合 useResizeObserver 自动重算，保证进度准确
import { type RefObject, useCallback, useEffect, useState } from "react";

import { useResizeObserver } from "./use-resize-observer";

type UseScrollProgressOptions = {
	direction?: "vertical" | "horizontal";
};

// > 返回 scrollProgress（0~1）、scrollable（是否可滚动）、updateScrollProgress（手动触发重算）
// > 用途：遮罩透明度、阅读进度条、懒加载判断；scrollable 用于「不可滚动时整体隐藏遮罩」
export function useScrollProgress(
	ref: RefObject<HTMLElement | null>,
	{ direction = "vertical" }: UseScrollProgressOptions = {},
): {
	scrollProgress: number;
	scrollable: boolean;
	updateScrollProgress: () => void;
} {
	const [scrollProgress, setScrollProgress] = useState(1);
	const [scrollable, setScrollable] = useState(false);

	// 手动触发重算：调用方绑到滚动容器的 onScroll 上
	const updateScrollProgress = useCallback(() => {
		if (ref.current) {
			const { progress, scrollable: canScroll } = readProgress(ref.current, direction);
			setScrollProgress(progress);
			setScrollable(canScroll);
		}
	}, [direction, ref]);

	// 监听尺寸变化重算进度（窗口缩放、内容增减、折叠展开等都会改变可滚动距离）
	const resizeObserverEntry = useResizeObserver(ref);
	// biome-ignore lint/correctness/useExhaustiveDependencies: resizeObserverEntry 作为尺寸变化的触发信号，effect body 不读它但需响应其变化
	useEffect(() => {
		updateScrollProgress();
	}, [resizeObserverEntry, updateScrollProgress]);

	return { scrollProgress, scrollable, updateScrollProgress };
}

// 从容器读取滚动进度（0~1）与是否可滚动：已滚动距离 / 可滚动总距离
// el	要读尺寸的 DOM 元素
// direction	监听竖向（vertical）还是横向（horizontal）滚动
// ! 容差 1px：scrollHeight 受 box-sizing/sub-pixel 影响，内容刚铺满时常有 ±0.x px 抖动，
// ! 严格相等判断会让分母接近 0，算出荒诞的进度值，导致 ScrollMask 在不可滚动状态下误显示
const readProgress = (
	el: HTMLElement,
	direction: "vertical" | "horizontal",
): { progress: number; scrollable: boolean } => {
	// 已滚动的距离
	const scroll = direction === "vertical" ? el.scrollTop : el.scrollLeft;
	// 内容总尺寸（含超出视口的部分）
	const scrollSize = direction === "vertical" ? el.scrollHeight : el.scrollWidth;
	// 视口尺寸（容器可见区域大小）
	const clientSize = direction === "vertical" ? el.clientHeight : el.clientWidth;
	// 可滚动总距离，<=1px 视为不可滚动（避免 sub-pixel 抖动放大成巨大进度）
	const scrollableDistance = scrollSize - clientSize;
	if (scrollableDistance <= 1) return { progress: 1, scrollable: false };
	return { progress: Math.min(scroll / scrollableDistance, 1), scrollable: true };
};
