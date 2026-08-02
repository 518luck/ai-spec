// # useInertialScroll：让滚动容器具备惯性缓动效果（rAF + lerp）
// > 解决 wheel 直接赋值 scrollLeft/scrollTop 导致的"一格一跳"顿挫感
// > react-use 未提供同类语义（useMouseWheel 只返回累积值，不含动画），按 hooks/AGENTS.md 例外条款自实现
// > 工作原理：wheel 事件把 delta 累加到 target，rAF 循环用 lerp 让 current 渐进逼近 target
// ! 横向把纵向滚轮转横滚时必须用非 passive 原生监听，React onWheel 无法可靠 preventDefault，否则页面会跟着滚

import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef } from "react";

type UseInertialScrollOptions = {
	// 滚动方向：vertical 处理 deltaY，horizontal 把 deltaY 转成横向位移
	direction?: "vertical" | "horizontal";
	// 缓动因子 (0,1)：越大到达目标越快，越小越柔；默认 0.2
	smooth?: number;
	// 为 false 时不绑原生 wheel（条件渲染的滚动节点未挂载时关掉）
	enabled?: boolean;
};

// > 返回编程式 scrollTo 与 cancel；wheel 监听由内部原生非 passive 绑定，使用处无需（也不应）再绑 onWheel
export function useInertialScroll(
	ref: RefObject<HTMLElement | null>,
	{ direction = "vertical", smooth = 0.2, enabled = true }: UseInertialScrollOptions = {},
): {
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

	// 处理一次 wheel：横滚容器把纵轮/横手势都转成横向位移；返回是否已消费事件（需 preventDefault）
	const consumeWheel = useCallback(
		(e: Pick<globalThis.WheelEvent, "deltaX" | "deltaY">): boolean => {
			const el = ref.current;
			if (!el) return false;

			if (direction === "horizontal") {
				const maxScroll = el.scrollWidth - el.clientWidth;
				// 内容未溢出：不拦截，让页面正常竖滚
				if (maxScroll <= 1) return false;

				// > 横向手势（deltaX 为主）也接管：统一转成横滚并拦截默认行为，
				//   否则浏览器对容器横滚的同时，页面/父级仍会跟着竖滚（上下微动）
				const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
				const atStart = el.scrollLeft <= 0 && delta < 0;
				const atEnd = el.scrollLeft >= maxScroll - 1 && delta > 0;
				// 已到边缘还继续往外滚：放行页面滚动
				if (atStart || atEnd) return false;

				scrollTo(delta);
				return true;
			}

			scrollTo(e.deltaY);
			return false;
		},
		[direction, ref, scrollTo],
	);

	// > 原生 wheel + passive:false，才能挡住页面跟着竖滚（React 合成 wheel 不可靠）
	useLayoutEffect(() => {
		if (!enabled) return;
		const el = ref.current;
		if (!el) return;

		const onWheel = (e: globalThis.WheelEvent) => {
			if (consumeWheel(e)) {
				e.preventDefault();
			}
		};

		el.addEventListener("wheel", onWheel, { passive: false });
		return () => {
			el.removeEventListener("wheel", onWheel);
		};
	}, [consumeWheel, enabled, ref]);

	// 卸载时清理 rAF，避免内存泄漏与跨组件污染
	useEffect(() => cancel, [cancel]);

	return { scrollTo, cancel };
}
