"use client";

// # 纸飞机入箱：收件托盘先落定，纸飞机从画面外划一道先扬后俯冲的弧线落进投递口，托盘轻轻一沉表示"收到"，歇一拍再等下一架

import { motion, type Transition } from "motion/react";
import type { JSX } from "react";

import { ENTER_TRANSITION, idleLoop } from "../lib/presets";

// 主循环总时长与歇息间隔（秒）：飞机、托盘、涟漪共用同一时长，靠 times 对齐，循环永不漂移
const LOOP_DURATION = 3;
const LOOP_REST = 1.8;

// idle 起始延迟（秒）：等托盘与文案进场完成后，第一架飞机才起飞
const IDLE_DELAY = 0.8;

// 落入时刻（循环进度 0~1）：飞机淡出、托盘下沉、涟漪扩散都对齐到这一点
const LANDING_AT = 0.78;

// 主循环轨道工厂：各元素共用同一时长/延迟/歇息，仅 times 不同，保证严格同步
const loopSegment = (times: number[]): Transition => ({
	...idleLoop({
		duration: LOOP_DURATION,
		delay: IDLE_DELAY,
		repeatDelay: LOOP_REST,
	}),
	times,
});

export function EmptyInbox(): JSX.Element {
	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<svg
				className="size-24 text-muted-foreground"
				viewBox="0 0 64 80"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="纸飞机落入空收件托盘"
			>
				{/* 收件托盘：整组先上浮进场，内层再单独承担"收到"时的下沉 */}
				<motion.g
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={ENTER_TRANSITION}
				>
					{/* 飞机落入时以托盘底部为支点快速一沉，表示"接住了" */}
					<motion.g
						style={{
							transformBox: "fill-box",
							transformOrigin: "center bottom",
						}}
						animate={{ scaleY: [1, 1, 0.95, 1] }}
						transition={loopSegment([0, LANDING_AT, LANDING_AT + 0.05, LANDING_AT + 0.16])}
					>
						<path d="M15 52 8 62v6a3 3 0 0 0 3 3h42a3 3 0 0 0 3-3v-6l-7-10Z" />
						<path d="M8 62h11l4 4h18l4-4h11" />
					</motion.g>

					{/* 落入瞬间托盘口荡开一圈涟漪，随即散去 */}
					<motion.circle
						cx={34}
						cy={62}
						r={6}
						style={{ transformBox: "fill-box", transformOrigin: "center" }}
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: [0, 0, 0.5, 0], scale: [0.6, 0.6, 1.3] }}
						transition={{
							...loopSegment([0, LANDING_AT, LANDING_AT + 0.18]),
							opacity: loopSegment([0, LANDING_AT, LANDING_AT + 0.05, LANDING_AT + 0.18]),
						}}
					/>
				</motion.g>

				{/* 纸飞机：先扬后俯冲的弧线，rotate 跟随轨迹切线，落进投递口的瞬间淡出 */}
				<motion.g
					className="text-primary"
					style={{ transformBox: "fill-box", transformOrigin: "center" }}
					initial={{ opacity: 0, x: -36, y: -4, rotate: 12 }}
					animate={{
						x: [-36, 8, 0],
						y: [-4, -24, 14],
						rotate: [12, -8, 38],
						opacity: [0, 1, 1, 0],
					}}
					transition={{
						...loopSegment([0, 0.42, LANDING_AT]),
						opacity: loopSegment([0, 0.08, 0.7, LANDING_AT]),
					}}
				>
					<path d="M44 32 26 26l7 9-4 6Z" />
					<path d="M44 32 33 35" />
				</motion.g>
			</svg>

			<motion.div
				className="flex flex-col gap-1"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ ...ENTER_TRANSITION, delay: 0.2 }}
			>
				<p className="font-medium text-sm">收件箱空空如也</p>
				<p className="text-muted-foreground text-xs">分享给你的规约会出现在这里</p>
			</motion.div>
		</div>
	);
}
