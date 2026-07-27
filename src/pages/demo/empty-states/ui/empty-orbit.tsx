"use client";

// # 轨道星球：一颗带光环的小星球悬在空白宇宙里，卫星沿虚线轨道绕行、四角星光明灭——"空"但不冷清的通用兜底空状态

import { motion, type Transition } from "motion/react";
import type { JSX } from "react";

import { ENTER_TRANSITION, idleLoop, SPRING_TRANSITION } from "../lib/presets";

// @ 进场节拍（秒）：星球先弹出，轨道由内向外错峰展开，卫星入轨，最后文案与星光跟上
const RING_DELAY_BASE = 0.15;
const RING_DELAY_STEP = 0.12;
const SATELLITE_DELAY = 0.5;
const TEXT_DELAY = 0.7;
const FLOAT_DELAY = 1;

// 卫星匀速绕行：线性无限旋转，等进场让位后才起转
const orbitSpin = (duration: number): Transition => ({
	duration,
	ease: "linear",
	repeat: Number.POSITIVE_INFINITY,
	delay: SATELLITE_DELAY,
});

type StarOptions = {
	className: string;
	duration: number;
	delay: number;
};

// 四角星光：位置、周期与相位各不相同，避免同步闪烁的机械感
const STARS: readonly StarOptions[] = [
	{ className: "top-2 left-1 size-1 bg-primary/70", duration: 2.4, delay: 0.9 },
	{ className: "bottom-2 left-3 size-1.5 bg-muted-foreground/70", duration: 3, delay: 1.5 },
	{ className: "right-2 bottom-4 size-1 bg-muted-foreground/60", duration: 2.2, delay: 2.1 },
];

export function EmptyOrbit(): JSX.Element {
	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<div className="relative size-24">
				{/* 两圈虚线轨道：由内向外错峰展开 */}
				<motion.div
					className="absolute inset-0 m-auto size-16 rounded-full border border-border/70 border-dashed"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ ...ENTER_TRANSITION, delay: RING_DELAY_BASE }}
				/>
				<motion.div
					className="absolute inset-0 m-auto size-24 rounded-full border border-border/50 border-dashed"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ ...ENTER_TRANSITION, delay: RING_DELAY_BASE + RING_DELAY_STEP }}
				/>

				{/* // > 卫星绕行：旋转一个与轨道同尺寸的包装层，把圆点钉在其顶部中点，即得完美圆轨道 */}
				<motion.div
					className="absolute inset-0 m-auto size-24"
					initial={{ rotate: 0 }}
					animate={{ rotate: 360 }}
					transition={orbitSpin(13)}
				>
					<motion.span
						className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/60"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ ...ENTER_TRANSITION, delay: SATELLITE_DELAY }}
					/>
				</motion.div>
				{/* 内圈卫星：反向、更快，起始相位与外圈错开 */}
				<motion.div
					className="absolute inset-0 m-auto size-16"
					initial={{ rotate: 140 }}
					animate={{ rotate: -220 }}
					transition={orbitSpin(8)}
				>
					<motion.span
						className="absolute top-0 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ ...ENTER_TRANSITION, delay: SATELLITE_DELAY }}
					/>
				</motion.div>

				{/* 星球本体：外层负责弹性落定，内层负责落定后的缓慢浮沉 */}
				<motion.div
					className="absolute inset-0 m-auto size-10"
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={SPRING_TRANSITION}
				>
					<motion.div
						animate={{ y: [0, -2, 0, 2, 0] }}
						transition={idleLoop({ duration: 4.5, delay: FLOAT_DELAY })}
					>
						<svg
							className="block size-10 text-muted-foreground"
							viewBox="0 0 48 48"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
							role="img"
							aria-label="带光环的小星球悬在轨道中央"
						>
							{/* 光环斜置：后半段在星球两侧断开并调暗，前半段压在球面上，形成前后层次 */}
							<g transform="rotate(-16 24 24)">
								<path className="opacity-60" d="M7 24A17 6 0 0 1 16.8 18.6" />
								<path className="opacity-60" d="M31.2 18.6A17 6 0 0 1 41 24" />
								<circle cx="24" cy="24" r="9" />
								<path className="opacity-50" d="M19 21h4M23 27h4" />
								<path d="M7 24A17 6 0 0 0 41 24" />
							</g>
						</svg>
					</motion.div>
				</motion.div>

				{/* 远处星光：小圆点各自错相位明灭 */}
				{STARS.map(({ className, duration, delay }) => (
					<motion.span
						key={className}
						className={`absolute rounded-full ${className}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: [0.15, 0.9, 0.15] }}
						transition={idleLoop({ duration, delay })}
					/>
				))}
				{/* 十字星光：右上角亮一点的主角星 */}
				<motion.svg
					className="absolute top-1 right-1 size-2 text-primary/80"
					viewBox="0 0 8 8"
					fill="none"
					stroke="currentColor"
					strokeWidth={1.5}
					strokeLinecap="round"
					initial={{ opacity: 0 }}
					animate={{ opacity: [0.15, 0.9, 0.15] }}
					transition={idleLoop({ duration: 2.6, delay: 1.2 })}
					aria-hidden="true"
				>
					<path d="M4 1v6M1 4h6" />
				</motion.svg>
			</div>

			{/* 文案：插画进场后再上浮淡入 */}
			<motion.div
				className="flex flex-col gap-1"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ ...ENTER_TRANSITION, delay: TEXT_DELAY }}
			>
				<p className="font-medium text-sm">这里还是一片空白</p>
				<p className="text-muted-foreground text-xs">创建第一条内容，点亮这片宇宙</p>
			</motion.div>
		</div>
	);
}
