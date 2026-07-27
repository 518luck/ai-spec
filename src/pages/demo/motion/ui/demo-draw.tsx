"use client";

// # 描边绘制：空状态插画沿路径一笔画出来，画完文案才跟上，让"这里什么都没有"变成一段可看的过程

import { motion, type Transition } from "motion/react";
import type { JSX } from "react";

import { ENTER_TRANSITION } from "../lib/presets";

// 描边总时长（秒）：后面文案的 delay 由它推出来，改这一个值两段自动对齐
const DRAW_DURATION = 0.9;

// 逐段描边的公共参数：pathLength 从 0 长到 1，就是"笔尖沿路径走一遍"
const drawTransition = (delay: number): Transition => ({
	duration: DRAW_DURATION,
	ease: "easeInOut",
	delay,
});

export function DemoDraw(): JSX.Element {
	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<svg
				className="size-20 text-muted-foreground"
				viewBox="0 0 64 64"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="空文件夹"
			>
				<motion.path
					d="M6 18a4 4 0 0 1 4-4h13l5 6h26a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4Z"
					initial={{ pathLength: 0 }}
					animate={{ pathLength: 1 }}
					transition={drawTransition(0)}
				/>
				<motion.path
					d="M24 38h16"
					initial={{ pathLength: 0 }}
					animate={{ pathLength: 1 }}
					transition={drawTransition(DRAW_DURATION * 0.6)}
				/>
			</svg>

			<motion.div
				className="flex flex-col gap-1"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ ...ENTER_TRANSITION, delay: DRAW_DURATION * 1.2 }}
			>
				<p className="font-medium text-sm">还没有任何规约</p>
				<p className="text-muted-foreground text-xs">新建一条，或从模板库导入</p>
			</motion.div>
		</div>
	);
}
