"use client";

// # 逐行书写：一支笔悬在空文档上，一行行把内容写出来，写满三行墨迹淡去、回到行首重来——空白只是还没落笔

import { motion, type Transition } from "motion/react";
import type { JSX } from "react";

import { ENTER_TRANSITION } from "../lib/presets";

// > 主循环唯一的时长来源：所有元素都按同一 duration + 各自 times 展开 keyframes，墨迹与笔尖永不漂移
const WRITE_DURATION = 4.5;
// 每轮写完后的停顿：淡下去的墨迹保持片刻再从头写起
const LOOP_REST = 0.8;
// 笔比文档稍晚从右上滑入
const PEN_ENTER_DELAY = 0.15;
// 进场收尾后主循环才落笔
const WRITE_DELAY = 0.55;
// 文案在插画进场后上浮
const TEXT_DELAY = 0.35;

// 主循环公共节奏：传入各元素自己的 times，即可挂到同一条时间轴上
const loopTransition = (times: number[]): Transition => ({
	duration: WRITE_DURATION,
	times,
	delay: WRITE_DELAY,
	repeat: Number.POSITIVE_INFINITY,
	repeatDelay: LOOP_REST,
	ease: "easeInOut",
});

type InkLine = {
	d: string;
	times: number[];
	pathLength: number[];
	opacity: number[];
};

// 三行墨迹：times 划出各自的书写窗口，写完保持到 0.88 后一起淡到 0.2 等待重来
const INK_LINES: InkLine[] = [
	{
		d: "M16 22h20",
		times: [0, 0.24, 0.88, 1],
		pathLength: [0, 1, 1, 1],
		opacity: [1, 1, 1, 0.2],
	},
	{
		d: "M16 32h16",
		times: [0, 0.3, 0.52, 0.88, 1],
		pathLength: [0, 0, 1, 1, 1],
		opacity: [1, 1, 1, 1, 0.2],
	},
	{
		d: "M16 42h12",
		times: [0, 0.58, 0.78, 0.88, 1],
		pathLength: [0, 0, 1, 1, 1],
		opacity: [1, 1, 1, 1, 0.2],
	},
];

// 笔尖轨迹：x 从各行行首扫到行尾、y 在换行时刻下移一行，0.88 后趁淡出摆回第一行行首
const PEN_MOVE_TIMES = [0, 0.24, 0.3, 0.52, 0.58, 0.78, 0.88, 0.96, 1];
const PEN_MOVE_X = [0, 20, 0, 16, 0, 12, 12, 0, 0];
const PEN_MOVE_Y = [0, 0, 10, 10, 20, 20, 20, 0, 0];
const PEN_MOVE_OPACITY = [1, 1, 1, 1, 1, 1, 1, 0.2, 1];

// 运笔抖动：只在三个书写窗口内 ±2° 小幅摆动，换行与收尾保持水平
const PEN_TILT_TIMES = [0, 0.08, 0.16, 0.24, 0.3, 0.38, 0.45, 0.52, 0.58, 0.66, 0.72, 0.78, 1];
const PEN_TILT_ROTATE = [0, -2, 2, 0, 0, -2, 2, 0, 0, -2, 2, 0, 0];

// 铅笔形状：笔尖落在 (0,0)、笔身斜向右上，方便用 translate 直接把笔尖对到书写点
const PEN_BODY = "M0 0L6.3 -2.1L14.8 -10.6L10.6 -14.8L2.1 -6.3Z";
const PEN_COLLAR = "M6.3 -2.1L2.1 -6.3";

export function EmptyWriting(): JSX.Element {
	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<svg
				className="size-24 text-muted-foreground"
				viewBox="0 0 64 64"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="一支笔在空文档上逐行书写"
			>
				{/* 文档轮廓：整段叙事的画布，先淡入上浮 */}
				<motion.path
					d="M14 8h26a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z"
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={ENTER_TRANSITION}
				/>

				{/* 三行墨迹：在各自的时间窗口里被"写"出来 */}
				{INK_LINES.map(({ d, times, pathLength, opacity }) => (
					<motion.path
						key={d}
						d={d}
						initial={{ pathLength: 0 }}
						animate={{ pathLength, opacity }}
						transition={loopTransition(times)}
					/>
				))}

				{/* 笔：外层负责从右上滑入，中层静态定位到第一行行首，内层沿主时间轴移动 */}
				<motion.g
					initial={{ opacity: 0, x: 10, y: -8 }}
					animate={{ opacity: 1, x: 0, y: 0 }}
					transition={{ ...ENTER_TRANSITION, delay: PEN_ENTER_DELAY }}
				>
					<g transform="translate(16 22)">
						<motion.g
							animate={{ x: PEN_MOVE_X, y: PEN_MOVE_Y, opacity: PEN_MOVE_OPACITY }}
							transition={loopTransition(PEN_MOVE_TIMES)}
						>
							{/* 旋转支点钉在笔尖，摆动才像手腕运笔而不是绕 SVG 原点打转 */}
							<motion.g
								className="text-foreground"
								animate={{ rotate: PEN_TILT_ROTATE }}
								transition={loopTransition(PEN_TILT_TIMES)}
								style={{ transformBox: "fill-box", transformOrigin: "left bottom" }}
							>
								<path d={PEN_BODY} />
								<path d={PEN_COLLAR} />
							</motion.g>
						</motion.g>
					</g>
				</motion.g>
			</svg>

			<motion.div
				className="flex flex-col gap-1"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ ...ENTER_TRANSITION, delay: TEXT_DELAY }}
			>
				<p className="font-medium text-sm">还没有任何规约</p>
				<p className="text-muted-foreground text-xs">从一条团队约定开始沉淀</p>
			</motion.div>
		</div>
	);
}
