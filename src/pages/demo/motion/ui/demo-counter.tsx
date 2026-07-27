"use client";

// # 数字滚动：统计值从 0 缓动到目标值，配合下方进度条一起推进，空页面的数据区不至于一上来就是死的

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { type JSX, useEffect } from "react";

import { ENTER_TRANSITION } from "../lib/presets";

const TARGET_COUNT = 2847;
const TARGET_RATIO = 0.72;

// 滚动时长（秒）：进度条与数字共用，两者必须同时到位
const COUNT_DURATION = 1.4;

export function DemoCounter(): JSX.Element {
	const count = useMotionValue(0);
	// > 直接渲染 MotionValue：每帧只更新这一个文本节点，不会触发组件重渲染
	const display = useTransform(count, (value) => Math.round(value).toLocaleString("zh-CN"));

	useEffect(() => {
		const controls = animate(count, TARGET_COUNT, { duration: COUNT_DURATION, ease: "easeOut" });
		return () => controls.stop();
	}, [count]);

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="flex items-baseline gap-1.5">
				<motion.span className="font-semibold text-4xl tabular-nums tracking-tight">
					{display}
				</motion.span>
				<span className="text-muted-foreground text-sm">条规约</span>
			</div>

			<div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
				<motion.div
					className="h-full rounded-full bg-primary"
					initial={{ scaleX: 0 }}
					animate={{ scaleX: TARGET_RATIO }}
					transition={{ duration: COUNT_DURATION, ease: "easeOut" }}
					style={{ originX: 0 }}
				/>
			</div>

			<motion.p
				className="text-muted-foreground text-xs"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ ...ENTER_TRANSITION, delay: COUNT_DURATION }}
			>
				本月覆盖率 72%
			</motion.p>
		</div>
	);
}
