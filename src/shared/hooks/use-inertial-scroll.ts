// # useInertialScroll：让滚动容器具备惯性缓动效果（rAF + lerp）
// > 解决 wheel 直接赋值 scrollLeft/scrollTop 导致的"一格一跳"顿挫感
// > react-use 未提供同类语义（useMouseWheel 只返回累积值，不含动画），按 hooks/AGENTS.md 例外条款自实现
// > 工作原理：wheel 事件把 delta 累加到 target，rAF 循环用 lerp 让 current 渐进逼近 target

import type { WheelEvent } from "react";
import { type RefObject, useCallback, useEffect, useRef } from "react";

type UseInertialScrollOptions = {
	// 滚动方向：vertical 处理 deltaY，horizontal 把 deltaY 转成横向位移
	direction?: "vertical" | "horizontal";
	// 缓动因子 (0,1)：越大到达目标越快，越小越柔；默认 0.2
	smooth?: number;
};

// > 返回可绑到 onWheel 的 handler 与编程式 scrollTo，均走 rAF 缓动
export function useInertialScroll(
	ref: RefObject<HTMLElement | null>,
	{ direction = "vertical", smooth = 0.2 }: UseInertialScrollOptions = {},
): {
	handleWheel: (e: WheelEvent<HTMLElement>) => void;
	scrollTo: (delta: number) => void;
	cancel: () => void;
} {
	// 目标位置：wheel/scrollTo 累加到这里，rAF 循环渐进逼近
	const targetRef = useRef(0);
	// rAF handle，卸载时清理
	const rafRef = useRef<number | null>(null);

	// 当前动画读取的滚动轴：horizontal 时走 scrollLeft，否则 scrollTop
	const readCurrent = useCallback((): number => {
		const el = ref.current;
		return el ? (direction === "horizontal" ? el.scrollLeft : el.scrollTop) : 0;
	}, [direction, ref]);

	// rAF 循环：lerp 让 current 逼近 target，差值 <1px 视为到位停止
	const tick = useCallback(() => {
		const el = ref.current;
		rafRef.current = null;
		if (!el) return;
		const current = readCurrent();
		const diff = targetRef.current - current;
		// 收敛阈值：差值小于 1px 直接到位，避免无限 rAF 循环
		if (Math.abs(diff) < 1) {
			if (direction === "horizontal") el.scrollLeft = targetRef.current;
			else el.scrollTop = targetRef.current;
			return;
		}
		const next = current + diff * smooth;
		if (direction === "horizontal") el.scrollLeft = next;
		else el.scrollTop = next;
		rafRef.current = requestAnimationFrame(tick);
	}, [direction, readCurrent, ref, smooth]);

	// 启动 rAF 循环（若未启动）
	const scheduleTick = useCallback(() => {
		if (rafRef.current === null) {
			rafRef.current = requestAnimationFrame(tick);
		}
	}, [tick]);

	// 取消正在进行的动画：用于外部干预或卸载清理
	const cancel = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		targetRef.current = readCurrent();
	}, [readCurrent]);

	// > 统一入口：把 delta 加到 target 并启动缓动
	const scrollTo = useCallback(
		(delta: number) => {
			targetRef.current = readCurrent() + delta;
			scheduleTick();
		},
		[readCurrent, scheduleTick],
	);

	// > wheel handler：垂直滚轮转横向（horizontal 模式），原样转发纵向（vertical 模式）
	// > horizontal 模式下，触控板的真实横向滚动（deltaX 为主）交给浏览器原生处理，不抢事件
	const handleWheel = useCallback(
		(e: WheelEvent) => {
			const el = ref.current;
			if (!el) return;
			if (direction === "horizontal") {
				// 垂直滚轮为主时才转横向：避免抢走真实横向滚轮（触控板）事件
				if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
				e.preventDefault();
				scrollTo(e.deltaY);
			} else {
				scrollTo(e.deltaY);
			}
		},
		[direction, ref, scrollTo],
	);

	// 卸载时清理 rAF，避免内存泄漏与跨组件污染
	useEffect(() => cancel, [cancel]);

	return { handleWheel, scrollTo, cancel };
}
