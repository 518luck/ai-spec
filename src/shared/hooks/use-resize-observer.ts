import { type RefObject, useEffect, useState } from "react";

/**
 * Use a ResizeObserver to react to changes in an element's size
 *
 * More about ResizeObserver: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
export function useResizeObserver(
	// 外部传进来的 ref，指向需要被监听尺寸变化的 DOM 元素。
	elementRef: RefObject<Element | null>,
	// 返回最新一次 ResizeObserver 观察到的元素尺寸信息；还没观察到时是 undefined。
): ResizeObserverEntry | undefined {
	// 用 state 保存最新的观察结果；setEntry 会触发使用这个 hook 的组件重新渲染。
	const [entry, setEntry] = useState<ResizeObserverEntry>();

	useEffect(() => {
		// React ref 的 current 才是真正的 DOM 节点；首次渲染前可能还是 null。
		const node = elementRef?.current;
		// 如果 DOM 节点还不存在，就不创建 observer。
		if (!node) return;

		// 创建浏览器原生 ResizeObserver，元素尺寸变化时保存最新尺寸信息触发重渲染。
		// 回调参数是数组（可同时观察多元素），这里只观察一个，所以取数组里的第一个 entry。
		const observer = new ResizeObserver(([entry]) => {
			setEntry(entry);
		});

		// 开始观察这个 DOM 节点的尺寸变化。
		observer.observe(node);

		// 组件卸载或依赖变化时断开观察，避免继续监听已经不用的 DOM 节点。
		return () => observer.disconnect();
	}, [elementRef]);

	// 把最新一次观察到的尺寸信息返回给调用方。
	return entry;
}
