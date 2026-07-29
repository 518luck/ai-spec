"use client";

// # 无限滚动加载 hook：useInView + 防抖自动触发 setSize
// > 封装 react-intersection-observer 的 useInView 与 useSWRInfinite 的 setSize，调用方只需挂 ref

import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

type UseInfiniteLoadOptions = {
	// 是否还有下一页
	hasMore: boolean;
	// 是否正在加载（来自 useSWRInfinite 的 isValidating）
	isValidating: boolean;
	// 触发加载下一页（来自 useSWRInfinite 的 setSize）
	setSize: (fn: (size: number) => number) => Promise<any>;
	// 提前多少像素触发加载，默认 200px
	rootMargin?: string;
	// 防抖延迟（ms），默认 100ms
	delayMs?: number;
};

// > 返回 callback ref，挂到哨兵元素上即可；哨兵必须一直挂载，不能跟着 loading 状态卸载
export function useInfiniteLoad({
	hasMore,
	isValidating,
	setSize,
	rootMargin = "200px",
	delayMs = 100,
}: UseInfiniteLoadOptions): (node: Element | null) => void {
	const { ref, inView } = useInView({ rootMargin, threshold: 0 });

	// 用 ref 保存最新的 setSize，避免 IntersectionObserver 回调里的闭包过期
	const savedSetSize = useRef(setSize);
	useEffect(() => {
		savedSetSize.current = setSize;
	}, [setSize]);

	// 防抖自动加载：可见 + 还有更多 + 不在加载中
	useEffect(() => {
		if (!inView || !hasMore || isValidating) return;
		const timer = setTimeout(() => {
			savedSetSize.current((s) => s + 1);
		}, delayMs);
		return () => clearTimeout(timer);
	}, [inView, hasMore, isValidating, delayMs]);

	return ref;
}
