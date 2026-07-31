"use client";

// # 无限滚动加载 hook：useInView + 防抖自动触发 fetchNextPage
// > 封装 react-intersection-observer 的 useInView 与 TanStack Query 的 fetchNextPage，调用方只需挂 ref
// > 哨兵 + 防抖骨架：进入视口后延迟触发，避免快速滚动期间重复/连续触发翻页

import { type RefCallback, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

type UseInfiniteLoadOptions = {
	// 是否还有下一页（来自 useInfiniteQuery 的 hasNextPage）
	hasNextPage: boolean;
	// 是否正在加载下一页（来自 useInfiniteQuery 的 isFetchingNextPage）
	isFetchingNextPage: boolean;
	// 触发加载下一页（来自 useInfiniteQuery 的 fetchNextPage）
	fetchNextPage: () => void;
	// 提前多少像素触发加载，默认 200px
	rootMargin?: string;
	// 防抖延迟（ms），默认 100ms
	debounceMs?: number;
};

// > 返回 callback ref，挂到哨兵元素上即可；哨兵必须一直挂载，不能跟着 loading 状态卸载
export function useInfiniteLoad({
	hasNextPage,
	isFetchingNextPage,
	fetchNextPage,
	rootMargin = "200px",
	debounceMs = 100,
}: UseInfiniteLoadOptions): RefCallback<HTMLDivElement> {
	const { ref, inView } = useInView({ rootMargin, threshold: 0 });

	// 用 ref 保存最新的 fetchNextPage，避免 setTimeout 回调里的闭包过期
	const savedFetchNextPage = useRef(fetchNextPage);
	useEffect(() => {
		savedFetchNextPage.current = fetchNextPage;
	}, [fetchNextPage]);

	// 防抖自动加载：可见 + 还有下一页 + 不在加载中
	useEffect(() => {
		if (!inView || !hasNextPage || isFetchingNextPage) return;
		const timer = setTimeout(() => {
			savedFetchNextPage.current();
		}, debounceMs);
		return () => clearTimeout(timer);
	}, [inView, hasNextPage, isFetchingNextPage, debounceMs]);

	return ref;
}
