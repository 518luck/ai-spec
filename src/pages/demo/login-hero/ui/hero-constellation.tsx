"use client";

// # 登录侧板候选：星座网络 —— 规约星图分前后两层视差漂移，星点错相位闪烁，脉冲沿连线轮流传导

import { motion } from "motion/react";
import type { JSX } from "react";

// @ 星点与连线数据（viewBox 440x640 坐标系）

const STAR_TONES = ["silver", "indigo", "cyan"] as const;

type StarTone = (typeof STAR_TONES)[number];

type Star = {
	x: number;
	y: number;
	r: number;
	tone: StarTone;
	/** 进场浮现的错峰延迟（秒） */
	entryDelay: number;
	/** 若存在则参与闪烁脉冲 */
	twinkle?: { duration: number; delay: number };
};

type Link = {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	/** 主干连线更亮更粗 */
	emphasis?: boolean;
};

// 每种色调的亮核与光晕颜色：亮核接近白，光晕取低饱和冷色
const TONE_COLORS: Record<StarTone, { core: string; halo: string }> = {
	silver: { core: "rgb(226,232,240)", halo: "rgb(168,180,194)" },
	indigo: { core: "rgb(203,212,252)", halo: "rgb(134,146,216)" },
	cyan: { core: "rgb(198,230,238)", halo: "rgb(118,178,198)" },
};

// 前景亮层：大而亮的主星，承载网络主干
const FRONT_STARS = [
	{ x: 72, y: 92, r: 2.6, tone: "silver", entryDelay: 0.15 },
	{ x: 206, y: 58, r: 3, tone: "cyan", entryDelay: 0, twinkle: { duration: 3.4, delay: 1.1 } },
	{
		x: 356,
		y: 116,
		r: 2.6,
		tone: "silver",
		entryDelay: 0.3,
		twinkle: { duration: 4.2, delay: 2.3 },
	},
	{ x: 118, y: 234, r: 2.4, tone: "indigo", entryDelay: 0.45 },
	{ x: 298, y: 208, r: 3.2, tone: "silver", entryDelay: 0.1 },
	{ x: 394, y: 318, r: 2.4, tone: "cyan", entryDelay: 0.55 },
	{ x: 74, y: 378, r: 2.6, tone: "silver", entryDelay: 0.25 },
	{ x: 226, y: 332, r: 3, tone: "indigo", entryDelay: 0.4, twinkle: { duration: 3.8, delay: 0.6 } },
	{ x: 330, y: 452, r: 2.4, tone: "silver", entryDelay: 0.7 },
	{ x: 148, y: 484, r: 2.6, tone: "cyan", entryDelay: 0.6, twinkle: { duration: 4.6, delay: 1.8 } },
] as const satisfies readonly Star[];

// 背景暗层：小而暗的远星，只做纵深陪衬
const BACK_STARS = [
	{ x: 38, y: 176, r: 1.2, tone: "silver", entryDelay: 0.5 },
	{ x: 150, y: 148, r: 1.4, tone: "indigo", entryDelay: 0.2, twinkle: { duration: 3, delay: 2 } },
	{ x: 262, y: 122, r: 1.2, tone: "silver", entryDelay: 0.8 },
	{
		x: 404,
		y: 196,
		r: 1.5,
		tone: "cyan",
		entryDelay: 0.35,
		twinkle: { duration: 4.4, delay: 0.3 },
	},
	{ x: 46, y: 286, r: 1.3, tone: "silver", entryDelay: 0.9 },
	{ x: 350, y: 262, r: 1.2, tone: "indigo", entryDelay: 0.15 },
	{ x: 188, y: 210, r: 1, tone: "silver", entryDelay: 1 },
	{
		x: 254,
		y: 286,
		r: 1.4,
		tone: "silver",
		entryDelay: 0.65,
		twinkle: { duration: 3.6, delay: 2.6 },
	},
	{ x: 64, y: 470, r: 1.3, tone: "cyan", entryDelay: 0.75 },
	{
		x: 272,
		y: 398,
		r: 1.5,
		tone: "silver",
		entryDelay: 0.45,
		twinkle: { duration: 5, delay: 1.4 },
	},
	{ x: 402, y: 512, r: 1.2, tone: "indigo", entryDelay: 1.1 },
] as const satisfies readonly Star[];

// 前景网络连线：主干加 emphasis，支线保持纤细
const FRONT_LINKS: readonly Link[] = [
	{ x1: 72, y1: 92, x2: 206, y2: 58, emphasis: true },
	{ x1: 206, y1: 58, x2: 356, y2: 116, emphasis: true },
	{ x1: 356, y1: 116, x2: 298, y2: 208, emphasis: true },
	{ x1: 72, y1: 92, x2: 118, y2: 234 },
	{ x1: 118, y1: 234, x2: 298, y2: 208 },
	{ x1: 298, y1: 208, x2: 226, y2: 332, emphasis: true },
	{ x1: 118, y1: 234, x2: 226, y2: 332 },
	{ x1: 298, y1: 208, x2: 394, y2: 318 },
	{ x1: 226, y1: 332, x2: 74, y2: 378 },
	{ x1: 394, y1: 318, x2: 330, y2: 452 },
	{ x1: 226, y1: 332, x2: 148, y2: 484, emphasis: true },
	{ x1: 74, y1: 378, x2: 148, y2: 484 },
	{ x1: 226, y1: 332, x2: 330, y2: 452 },
];

// 背景层的极淡短线：只为暗层添一点结构感
const BACK_LINKS = [
	{ x1: 38, y1: 176, x2: 150, y2: 148 },
	{ x1: 404, y1: 196, x2: 350, y2: 262 },
	{ x1: 254, y1: 286, x2: 272, y2: 398 },
] as const satisfies readonly Link[];

// > 脉冲传导路径：沿主干连线的折线，三条错开时间轮流亮起
const PULSES = [
	{ d: "M 72 92 L 206 58 L 356 116", delay: 2 },
	{ d: "M 356 116 L 298 208 L 226 332", delay: 4.4 },
	{ d: "M 118 234 L 226 332 L 148 484", delay: 6.8 },
] as const satisfies readonly { d: string; delay: number }[];

// 光晕径向渐变的 id，按色调区分
const haloGradientId = (tone: StarTone): string => `hero-constellation-halo-${tone}`;

export function HeroConstellation(): JSX.Element {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* // @ 背景光斑：两团大面积静态冷色辉光，只做进场淡入 */}
			<motion.div
				className="absolute -top-20 -left-24 h-96 w-96 rounded-full bg-[rgba(99,112,178,0.18)] blur-3xl"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1.8, ease: "easeOut" }}
			/>
			<motion.div
				className="absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-[rgba(94,150,168,0.14)] blur-3xl"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1.8, delay: 0.4, ease: "easeOut" }}
			/>

			<svg
				className="absolute inset-0 h-full w-full"
				viewBox="0 0 440 640"
				preserveAspectRatio="xMidYMid slice"
				role="img"
				aria-label="规约星座网络：星点与连线构成的星图缓慢漂移，脉冲沿连线传导"
			>
				<defs>
					{/* 星点光晕：从低透明冷色向外衰减到全透明 */}
					{STAR_TONES.map((tone) => (
						<radialGradient key={tone} id={haloGradientId(tone)}>
							<stop offset="0%" stopColor={TONE_COLORS[tone].halo} stopOpacity={0.5} />
							<stop offset="55%" stopColor={TONE_COLORS[tone].halo} stopOpacity={0.18} />
							<stop offset="100%" stopColor={TONE_COLORS[tone].halo} stopOpacity={0} />
						</radialGradient>
					))}
				</defs>

				{/* // @ 背景暗层：与前景反向的更慢视差，营造纵深 */}
				<motion.g
					animate={{ x: [0, -8, 0, 6, 0], y: [0, 8, 0, -7, 0] }}
					transition={{ duration: 36, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
				>
					{BACK_LINKS.map(({ x1, y1, x2, y2 }) => (
						<motion.line
							key={`${x1}-${y1}-${x2}-${y2}`}
							x1={x1}
							y1={y1}
							x2={x2}
							y2={y2}
							stroke="rgb(168,180,194)"
							strokeWidth={0.5}
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.1 }}
							transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
						/>
					))}
					<StarField stars={BACK_STARS} dim />
				</motion.g>

				{/* // @ 前景亮层：主星网络 + 连线 + 脉冲，缓慢正向漂移 */}
				<motion.g
					animate={{ x: [0, 10, 0, -8, 0], y: [0, -12, 0, 9, 0] }}
					transition={{ duration: 28, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
				>
					{/* 连线进场按序描画，主干与支线两档粗细透明度 */}
					{FRONT_LINKS.map(({ x1, y1, x2, y2, emphasis }, index) => (
						<motion.line
							key={`${x1}-${y1}-${x2}-${y2}`}
							x1={x1}
							y1={y1}
							x2={x2}
							y2={y2}
							stroke="rgb(168,180,194)"
							strokeWidth={emphasis ? 0.9 : 0.6}
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: emphasis ? 0.32 : 0.16 }}
							transition={{ duration: 1, delay: 0.6 + index * 0.07, ease: "easeOut" }}
						/>
					))}

					{/* // > 脉冲传导：短亮段（pathLength 0.2）沿折线滑到末端，亮起—滑行—熄灭，三条错峰循环 */}
					{PULSES.map(({ d, delay }) => (
						<motion.path
							key={d}
							d={d}
							fill="none"
							stroke="rgb(214,234,244)"
							strokeWidth={1.4}
							strokeLinecap="round"
							initial={{ pathLength: 0.2, pathOffset: 0, opacity: 0 }}
							animate={{ pathOffset: [0, 0, 0.8, 0.8], opacity: [0, 0, 1, 1, 0, 0] }}
							transition={{
								pathOffset: {
									duration: 7.2,
									times: [0, 0.08, 0.34, 1],
									delay,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								},
								opacity: {
									duration: 7.2,
									times: [0, 0.08, 0.13, 0.3, 0.36, 1],
									delay,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								},
							}}
						/>
					))}

					<StarField stars={FRONT_STARS} />
				</motion.g>
			</svg>

			{/* // @ 底部文案：进场时上浮淡入 */}
			<motion.div
				className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-1.5 px-6 text-center"
				initial={{ opacity: 0, y: 14 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
			>
				<p className="font-semibold text-neutral-200 text-xl">把团队规约，交给每一个 AI</p>
				<p className="text-neutral-500 text-sm">一次沉淀，处处生效</p>
			</motion.div>
		</div>
	);
}

type StarFieldProps = {
	stars: readonly Star[];
	/** 背景暗层：整体压暗、光晕收小 */
	dim?: boolean;
};

// 渲染一组星点：每颗 = 光晕大圆 + 亮核小圆，错峰浮现；带 twinkle 的再包一层无限透明度脉冲
function StarField({ stars, dim = false }: StarFieldProps): JSX.Element {
	return (
		<>
			{stars.map((star) => {
				const { x, y, r, tone, entryDelay, twinkle } = star;
				const { core } = TONE_COLORS[tone];
				const haloRadius = r * (dim ? 2.8 : 3.6);
				const dot = (
					<>
						<circle cx={x} cy={y} r={haloRadius} fill={`url(#${haloGradientId(tone)})`} />
						<circle cx={x} cy={y} r={r} fill={core} />
					</>
				);

				return (
					<motion.g
						key={`${x}-${y}`}
						initial={{ opacity: 0, scale: 0.4 }}
						animate={{ opacity: dim ? 0.7 : 1, scale: 1 }}
						transition={{ duration: 0.7, delay: entryDelay, ease: "easeOut" }}
						style={{ transformBox: "fill-box", transformOrigin: "center" }}
					>
						{twinkle ? (
							<motion.g
								animate={{ opacity: [1, 0.4, 1] }}
								transition={{
									duration: twinkle.duration,
									delay: twinkle.delay,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
							>
								{dot}
							</motion.g>
						) : (
							dot
						)}
					</motion.g>
				);
			})}
		</>
	);
}
