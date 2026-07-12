// # useScrollProgress：监听可滚动容器，返回当前滚动进度（0~1）
import { type RefObject, useCallback, useEffect, useState } from "react";

import { useResizeObserver } from "./use-resize-observer";

type UseScrollProgressOptions = {
	direction?: "vertical" | "horizontal";
};

// > 0=最顶部/最左侧，1=已到底/到最右；内容不足以滚动时返回 1（视为"已到底"）
// > 用途：遮罩透明度、阅读进度条、懒加载判断
// > 容器尺寸变化时配合 useResizeObserver 自动重算，保证进度准确
export function useScrollProgress(
	ref: RefObject<HTMLElement | null>,
	{ direction = "vertical" }: UseScrollProgressOptions = {},
): {
	scrollProgress: number;
	updateScrollProgress: () => void;
} {
	const [scrollProgress, setScrollProgress] = useState(1);

	// 手动触发重算：调用方绑到滚动容器的 onScroll 上
	const updateScrollProgress = useCallback(() => {
		if (ref.current) setScrollProgress(readProgress(ref.current, direction));
	}, [direction, ref]);

	// 监听尺寸变化重算进度（窗口缩放、内容增减、折叠展开等都会改变可滚动距离）
	const resizeObserverEntry = useResizeObserver(ref);
	// biome-ignore lint/correctness/useExhaustiveDependencies: resizeObserverEntry 作为尺寸变化的触发信号，effect body 不读它但需响应其变化
	useEffect(() => {
		updateScrollProgress();
	}, [resizeObserverEntry, updateScrollProgress]);

	return { scrollProgress, updateScrollProgress };
}

// 从容器读取滚动进度（0~1）：已滚动距离 / 可滚动总距离；内容不溢出时返回 1
// el	要读尺寸的 DOM 元素
// direction	监听竖向（vertical）还是横向（horizontal）滚动
const readProgress = (el: HTMLElement, direction: "vertical" | "horizontal"): number => {
	// 已滚动的距离
	const scroll = direction === "vertical" ? el.scrollTop : el.scrollLeft;
	// 内容总尺寸（含超出视口的部分）
	const scrollSize = direction === "vertical" ? el.scrollHeight : el.scrollWidth;
	// 视口尺寸（容器可见区域大小）
	const clientSize = direction === "vertical" ? el.clientHeight : el.clientWidth;
	return scrollSize === clientSize ? 1 : Math.min(scroll / (scrollSize - clientSize), 1);
};
