// # useThumbSmooth：内容追加时短暂开启滚动条 thumb 平滑过渡
// > base-ui 用 ResizeObserver 监听内容尺寸变化重算 thumb 位置（非每帧覆盖），
// > 所以内容突变时给 thumb 加 CSS transition，浏览器会自动平滑插值 transform 变化。
// > 仅在"追加新页"（依赖值增长）时短暂启用，避免正常滚动时 thumb 拖影。

import { useEffect, useRef, useState } from "react";

type UseThumbSmoothOptions = {
	// 平滑过渡保持时长（ms）；应略大于 ScrollArea thumb 的 transition-duration，确保动画播完
	duration?: number;
};

// > 传入列表长度等单调递增的依赖值；返回 thumbSmooth 标志，传给 ScrollArea 的 thumbSmooth prop
export const useThumbSmooth = (
	length: number,
	{ duration = 600 }: UseThumbSmoothOptions = {},
): boolean => {
	const prevLenRef = useRef(0);
	const [thumbSmooth, setThumbSmooth] = useState(false);

	useEffect(() => {
		const prev = prevLenRef.current;
		const next = length;
		// 仅"追加新页"（length 增长且非首次加载）时启用；首次加载/搜索切换/减少都不启用
		if (next > prev && prev > 0) {
			setThumbSmooth(true);
			const timer = setTimeout(() => setThumbSmooth(false), duration);
			prevLenRef.current = next;
			return () => clearTimeout(timer);
		}
		prevLenRef.current = next;
	}, [length, duration]);

	return thumbSmooth;
};
