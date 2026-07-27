"use client";

// # 呼吸柱图：还没有数据，但图表在"呼吸"——幽灵柱轻轻起伏、虚线均线漂浮，像在等第一条真实数据点亮它

import { motion } from "motion/react";
import type { JSX } from "react";

import { ENTER_TRANSITION, idleLoop, SPRING_TRANSITION, staggerDelay } from "../lib/presets";

// 进场时间轴：柱子先错峰弹起，趋势线随后描出，idle 循环与文案都从 IDLE_START 接棒
const TREND_DELAY = 0.45;
const TREND_DURATION = 0.8;
const IDLE_START = TREND_DELAY + TREND_DURATION;

// 虚线趋势线路径：横跨五根柱顶部的缓和波形（viewBox 112x96 与容器同比例）
const TREND_PATH = "M8 55 C 24 31, 40 67, 58 46 C 72 29, 86 53, 104 34";

// 趋势线遮罩 id：描边动画作用在遮罩上，虚线本体的 dasharray 才不会被 pathLength 覆盖
const TREND_MASK_ID = "empty-chart-trend-mask";

// 五根幽灵柱：高度错落，surge 标记的那根会周期性做一次更大的伸展，像"试图长出数据"
const BARS = [
	{ heightClass: "h-10", surge: false },
	{ heightClass: "h-14", surge: false },
	{ heightClass: "h-7", surge: false },
	{ heightClass: "h-16", surge: true },
	{ heightClass: "h-11", surge: false },
] as const;

export function EmptyChart(): JSX.Element {
	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<div
				className="relative h-24 w-28 text-muted-foreground"
				role="img"
				aria-label="等待数据的呼吸柱状图"
			>
				{/* 幽灵柱与基线：三层各管一段动画——进场弹起、呼吸、偶尔伸展 */}
				<div className="flex h-full items-end justify-center gap-1.5 border-border border-b">
					{BARS.map((bar, index) => {
						const barClass = `${bar.heightClass} w-3 rounded-t bg-muted`;

						return (
							<motion.div
								key={bar.heightClass}
								className="origin-bottom"
								initial={{ scaleY: 0 }}
								animate={{ scaleY: 1 }}
								transition={{ ...SPRING_TRANSITION, delay: staggerDelay(index) }}
							>
								{/* 呼吸层：各柱用不同 delay 错开相位，形成一道缓慢的波 */}
								<motion.div
									className="origin-bottom"
									animate={{ scaleY: [1, 1.12, 1] }}
									transition={idleLoop({
										duration: 2.6,
										delay: IDLE_START + index * 0.4,
									})}
								>
									{bar.surge ? (
										<motion.div
											className={`${barClass} origin-bottom`}
											animate={{ scaleY: [1, 1.35, 1] }}
											transition={idleLoop({
												duration: 1.2,
												delay: IDLE_START + 1.8,
												repeatDelay: 4,
											})}
										/>
									) : (
										<div className={barClass} />
									)}
								</motion.div>
							</motion.div>
						);
					})}
				</div>

				{/* 虚线趋势线：整体上下轻漂，描边进度交给遮罩里的白色路径 */}
				<motion.svg
					className="pointer-events-none absolute inset-0"
					viewBox="0 0 112 96"
					fill="none"
					aria-hidden="true"
					animate={{ y: [0, -2, 0, 2, 0] }}
					transition={idleLoop({ duration: 4, delay: IDLE_START })}
				>
					<defs>
						{/* 遮罩里的白描边表示"完全可见"，属亮度语义，不参与主题配色 */}
						<mask id={TREND_MASK_ID} maskUnits="userSpaceOnUse">
							<motion.path
								d={TREND_PATH}
								stroke="white"
								strokeWidth={4}
								strokeLinecap="round"
								initial={{ pathLength: 0 }}
								animate={{ pathLength: 1 }}
								transition={{
									duration: TREND_DURATION,
									ease: "easeInOut",
									delay: TREND_DELAY,
								}}
							/>
						</mask>
					</defs>
					<path
						d={TREND_PATH}
						stroke="currentColor"
						strokeWidth={2}
						strokeLinecap="round"
						strokeDasharray="4 4"
						mask={`url(#${TREND_MASK_ID})`}
					/>
				</motion.svg>
			</div>

			<motion.div
				className="flex flex-col gap-1"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ ...ENTER_TRANSITION, delay: IDLE_START }}
			>
				<p className="font-medium text-sm">暂无统计数据</p>
				<p className="text-muted-foreground text-xs">有了使用记录后这里会亮起来</p>
			</motion.div>
		</div>
	);
}
