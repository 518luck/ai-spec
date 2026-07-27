"use client";

// # 登录侧板候选：汇流分发 —— 四条彩色知识流蜿蜒汇入中央玻璃棱镜库，归纳成三条整齐的银蓝输出流持续分发

import { motion, type TargetAndTransition, type Transition } from "motion/react";
import type { JSX } from "react";

// @ 冷色四流配色：base 为低饱和光晕色，core 为接近白的亮核色，整体锚定亮银蓝
const FLOW_TONES = ["silver", "violet", "cyan", "teal"] as const;

type FlowTone = (typeof FLOW_TONES)[number];

const TONE_COLORS: Record<FlowTone, { base: string; core: string }> = {
	silver: { base: "rgb(168,180,194)", core: "rgb(228,234,240)" },
	violet: { base: "rgb(150,148,200)", core: "rgb(212,212,244)" },
	cyan: { base: "rgb(118,178,198)", core: "rgb(200,232,240)" },
	teal: { base: "rgb(126,172,162)", core: "rgb(206,234,226)" },
};

// @ 上半 · 归纳：四条蜿蜒输入流（viewBox 440x640，顶部入口 → 中枢顶边 y=282）

type InputFlow = {
	tone: FlowTone;
	/** 两段三次贝塞尔拼出的蜿蜒路径，刻意杂乱以对比下游的整齐 */
	d: string;
	/** 汇入中枢顶边的横坐标，用于绘制入口端口小灯 */
	endX: number;
	/** 光点滑完全程的时长，各流略有差异避免同步 */
	duration: number;
	/** 首枚光点开始流动的基准延迟 */
	dotDelay: number;
	/** 曲线描画的进场延迟 */
	entryDelay: number;
};

const INPUT_FLOWS: readonly InputFlow[] = [
	{
		tone: "silver",
		d: "M 60 -16 C 96 70, 22 140, 64 208 C 96 260, 150 258, 192 282",
		endX: 192,
		duration: 4.2,
		dotDelay: 1.6,
		entryDelay: 0.15,
	},
	{
		tone: "violet",
		d: "M 160 -16 C 128 64, 208 118, 176 186 C 152 236, 178 262, 209 282",
		endX: 209,
		duration: 3.6,
		dotDelay: 1.75,
		entryDelay: 0.3,
	},
	{
		tone: "cyan",
		d: "M 280 -16 C 316 68, 236 128, 272 196 C 292 238, 262 262, 231 282",
		endX: 231,
		duration: 4.8,
		dotDelay: 1.9,
		entryDelay: 0.45,
	},
	{
		tone: "teal",
		d: "M 380 -16 C 344 76, 416 150, 366 216 C 330 262, 292 268, 248 282",
		endX: 248,
		duration: 3.9,
		dotDelay: 2.05,
		entryDelay: 0.6,
	},
];

type EntryMark = {
	/** 图形含义，用作 key */
	label: string;
	/** 以 (0,0) 为中心的线稿图形，多段子路径合并在一条 d 里 */
	d: string;
	x: number;
	y: number;
	tone: FlowTone;
	entryDelay: number;
	floatDuration: number;
};

// 入口图标：文档 / 气泡 / 闪电 / 代码，低透明度悬浮在各自入口旁轻微浮动
const ENTRY_MARKS: readonly EntryMark[] = [
	{
		label: "规约文档",
		d: "M -5 -8 h6.5 l3.5 3.5 v12.5 h-10 z M -2 -1.5 h4 M -2 2.5 h4",
		x: 38,
		y: 96,
		tone: "silver",
		entryDelay: 0.5,
		floatDuration: 4.6,
	},
	{
		label: "提示词气泡",
		d: "M -5.5 -6 h11 a2.5 2.5 0 0 1 2.5 2.5 v4 a2.5 2.5 0 0 1 -2.5 2.5 h-5 l-4 4 v-4 h-2 a2.5 2.5 0 0 1 -2.5 -2.5 v-4 a2.5 2.5 0 0 1 2.5 -2.5 z",
		x: 183,
		y: 82,
		tone: "violet",
		entryDelay: 0.62,
		floatDuration: 5.4,
	},
	{
		label: "技能闪电",
		d: "M 1.5 -8 L -4.5 1 L -0.5 1 L -3 8 L 4.5 -1 L 0.5 -1 Z",
		x: 256,
		y: 88,
		tone: "cyan",
		entryDelay: 0.74,
		floatDuration: 4.1,
	},
	{
		label: "代码约定",
		d: "M -4 -5.5 L -8.5 0 L -4 5.5 M 4 -5.5 L 8.5 0 L 4 5.5 M 2 -8 L -2 8",
		x: 402,
		y: 102,
		tone: "teal",
		entryDelay: 0.86,
		floatDuration: 5,
	},
];

// @ 下半 · 复用：三条平行输出流（中枢底边 y=320 → 终点 y=496）与终点节点

// 输出光点统一时长：比输入更快、每条 3 枚相位均分，节奏整齐划一
const OUTPUT_DOT_DURATION = 2.7;

type OutputFlow = {
	/** 从中枢底部微微扇开后垂直下行的路径 */
	d: string;
	/** 离开中枢底边的横坐标，用于绘制出口端口小灯 */
	startX: number;
	entryDelay: number;
	dotDelay: number;
};

const OUTPUT_FLOWS: readonly OutputFlow[] = [
	{
		d: "M 196 320 C 196 342, 172 348, 172 372 L 172 496",
		startX: 196,
		entryDelay: 1.2,
		dotDelay: 2.2,
	},
	{ d: "M 220 320 L 220 496", startX: 220, entryDelay: 1.32, dotDelay: 2.5 },
	{
		d: "M 244 320 C 244 342, 268 348, 268 372 L 268 496",
		startX: 244,
		entryDelay: 1.44,
		dotDelay: 2.8,
	},
];

type EndpointNode = {
	x: number;
	/** 脉冲与本流光点抵达同相位：周期 = 光点时长 / 3 */
	pulseDelay: number;
	entryDelay: number;
};

const ENDPOINTS: readonly EndpointNode[] = [
	{ x: 172, pulseDelay: 3.1, entryDelay: 1.9 },
	{ x: 220, pulseDelay: 3.4, entryDelay: 2 },
	{ x: 268, pulseDelay: 3.7, entryDelay: 2.1 },
];

// 中枢棱镜里的三册“规约小书”，底边统一对齐 y=310
const HUB_BARS: readonly { x: number; h: number; delay: number }[] = [
	{ x: 208, h: 16, delay: 1.1 },
	{ x: 217, h: 20, delay: 1.2 },
	{ x: 226, h: 13, delay: 1.3 },
];

// 背景微星点：错相位缓慢闪烁
const SPARKS: readonly { x: number; y: number; r: number; duration: number; delay: number }[] = [
	{ x: 30, y: 240, r: 1.1, duration: 3.6, delay: 0.8 },
	{ x: 424, y: 184, r: 1.3, duration: 4.4, delay: 1.6 },
	{ x: 398, y: 408, r: 1, duration: 3.2, delay: 2.4 },
	{ x: 44, y: 452, r: 1.2, duration: 5, delay: 1.2 },
];

export function HeroFlow(): JSX.Element {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* // @ 环境光：左上与右下两团静态 blur 冷色光斑，只做进场淡入 */}
			<motion.div
				className="absolute -top-24 -left-24 size-96 rounded-full bg-[rgba(99,112,178,0.16)] blur-3xl"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1.8, ease: "easeOut" }}
			/>
			<motion.div
				className="absolute -right-24 bottom-16 size-80 rounded-full bg-[rgba(94,150,168,0.13)] blur-3xl"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1.8, delay: 0.4, ease: "easeOut" }}
			/>

			<svg
				className="absolute inset-0 h-full w-full"
				viewBox="0 0 440 640"
				preserveAspectRatio="xMidYMid slice"
				role="img"
				aria-label="知识汇流图：四条彩色知识流从顶部蜿蜒汇入中央棱镜库，归纳后化作三条整齐的银蓝输出流持续分发到底部终端"
			>
				<defs>
					{/* 输入流的纵向渐变描边：入口处几乎透明，越靠近中枢越亮 */}
					{FLOW_TONES.map((tone) => (
						<linearGradient
							key={tone}
							id={`hero-flow-in-${tone}`}
							gradientUnits="userSpaceOnUse"
							x1="0"
							y1="-16"
							x2="0"
							y2="300"
						>
							<stop offset="0" stopColor={TONE_COLORS[tone].base} stopOpacity={0.05} />
							<stop offset="0.55" stopColor={TONE_COLORS[tone].base} stopOpacity={0.22} />
							<stop offset="1" stopColor={TONE_COLORS[tone].base} stopOpacity={0.4} />
						</linearGradient>
					))}
					{/* 输出流渐变：离开中枢最亮，向终点缓慢衰减 */}
					<linearGradient
						id="hero-flow-out"
						gradientUnits="userSpaceOnUse"
						x1="0"
						y1="320"
						x2="0"
						y2="500"
					>
						<stop offset="0" stopColor="rgb(168,180,194)" stopOpacity={0.45} />
						<stop offset="1" stopColor="rgb(168,180,194)" stopOpacity={0.14} />
					</linearGradient>
					{/* 中枢背后的大团银蓝光晕 */}
					<radialGradient id="hero-flow-hub-halo">
						<stop offset="0" stopColor="rgb(168,180,194)" stopOpacity={0.26} />
						<stop offset="0.45" stopColor="rgb(168,180,194)" stopOpacity={0.1} />
						<stop offset="1" stopColor="rgb(168,180,194)" stopOpacity={0} />
					</radialGradient>
					{/* 玻璃棱镜的顶部受光面 */}
					<linearGradient id="hero-flow-hub-glass" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="rgb(255,255,255)" stopOpacity={0.1} />
						<stop offset="1" stopColor="rgb(255,255,255)" stopOpacity={0} />
					</linearGradient>
					{/* 终点节点光晕 */}
					<radialGradient id="hero-flow-node">
						<stop offset="0" stopColor="rgb(168,180,194)" stopOpacity={0.5} />
						<stop offset="55%" stopColor="rgb(168,180,194)" stopOpacity={0.18} />
						<stop offset="100%" stopColor="rgb(168,180,194)" stopOpacity={0} />
					</radialGradient>
				</defs>

				{/* 背景微星点 */}
				{SPARKS.map(({ x, y, r, duration, delay }) => (
					<motion.circle
						key={`${x}-${y}`}
						cx={x}
						cy={y}
						r={r}
						fill="rgb(206,216,226)"
						initial={{ opacity: 0 }}
						animate={{ opacity: [0.15, 0.65, 0.15] }}
						transition={{ duration, delay, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
					/>
				))}

				{/* // @ 输入流：曲线本体依次描画常驻，光点组随后开始循环滑行 */}
				{INPUT_FLOWS.map(({ tone, d, duration, dotDelay, entryDelay }) => (
					<g key={tone}>
						<motion.path
							d={d}
							fill="none"
							stroke={`url(#hero-flow-in-${tone})`}
							strokeWidth={2}
							strokeLinecap="round"
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: 1 }}
							transition={{
								duration: 1.1,
								delay: entryDelay,
								ease: "easeInOut",
								opacity: { duration: 0.4, delay: entryDelay, ease: "easeOut" },
							}}
						/>
						{/* 每条流两枚光点，相位错开半轮，像知识源源不断流入 */}
						{[0, 1].map((index) => (
							<FlowDot
								key={index}
								d={d}
								tone={tone}
								duration={duration}
								delay={dotDelay + (index * duration) / 2}
							/>
						))}
					</g>
				))}

				{/* 入口图标：外层管进场淡入，内层管无限轻浮动 */}
				{ENTRY_MARKS.map(({ label, d, x, y, tone, entryDelay, floatDuration }) => (
					<motion.g
						key={label}
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.55 }}
						transition={{ duration: 0.8, delay: entryDelay, ease: "easeOut" }}
					>
						<motion.g
							animate={{ y: [0, -3, 0] }}
							transition={{
								duration: floatDuration,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
						>
							<path
								d={d}
								transform={`translate(${x} ${y})`}
								fill="none"
								stroke={TONE_COLORS[tone].base}
								strokeWidth={1.3}
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</motion.g>
					</motion.g>
				))}

				{/* // @ 输出流：三条整齐平行的银蓝流，对比上游的杂乱蜿蜒 */}
				{OUTPUT_FLOWS.map(({ d, entryDelay, dotDelay }) => (
					<g key={d}>
						<motion.path
							d={d}
							fill="none"
							stroke="url(#hero-flow-out)"
							strokeWidth={2}
							strokeLinecap="round"
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: 1 }}
							transition={{
								duration: 0.7,
								delay: entryDelay,
								ease: "easeOut",
								opacity: { duration: 0.3, delay: entryDelay, ease: "easeOut" },
							}}
						/>
						{/* 每条流三枚光点相位均分，密度高于输入侧 */}
						{[0, 1, 2].map((index) => (
							<FlowDot
								key={index}
								d={d}
								tone="silver"
								duration={OUTPUT_DOT_DURATION}
								delay={dotDelay + (index * OUTPUT_DOT_DURATION) / 3}
							/>
						))}
					</g>
				))}

				{/* // @ 中枢棱镜：玻璃条 + 背后银蓝光晕，四流入三流出的咽喉 */}
				<motion.g
					initial={{ opacity: 0, scale: 0.92 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
					style={{ transformBox: "fill-box", transformOrigin: "center" }}
				>
					<ellipse cx={220} cy={300} rx={150} ry={84} fill="url(#hero-flow-hub-halo)" />
					<rect
						x={132}
						y={280}
						width={176}
						height={40}
						rx={12}
						fill="rgba(255,255,255,0.05)"
						stroke="rgba(255,255,255,0.14)"
						strokeWidth={1}
					/>
					<rect x={134} y={282} width={172} height={18} rx={10} fill="url(#hero-flow-hub-glass)" />
					{/* 棱镜内的三册规约小书，错峰立起 */}
					{HUB_BARS.map(({ x, h, delay }) => (
						<motion.rect
							key={x}
							x={x}
							y={310 - h}
							width={5}
							height={h}
							rx={2}
							fill="rgb(168,180,194)"
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.4 }}
							transition={{ duration: 0.5, delay, ease: "easeOut" }}
						/>
					))}
					{/* 入口端口小灯：颜色对应各输入流 */}
					{INPUT_FLOWS.map(({ tone, endX }) => (
						<motion.circle
							key={tone}
							cx={endX}
							cy={281}
							r={1.8}
							fill={TONE_COLORS[tone].core}
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.9 }}
							transition={{ duration: 0.5, delay: 1.05, ease: "easeOut" }}
						/>
					))}
					{/* 出口端口小灯：统一银蓝，示意“归纳后变有序” */}
					{OUTPUT_FLOWS.map(({ startX }) => (
						<motion.circle
							key={startX}
							cx={startX}
							cy={320}
							r={1.8}
							fill="rgb(228,234,240)"
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.9 }}
							transition={{ duration: 0.5, delay: 1.15, ease: "easeOut" }}
						/>
					))}
					{/* 高亮边框做 3s 极轻微亮度呼吸，呼应光点持续汇入 */}
					<motion.rect
						x={132}
						y={280}
						width={176}
						height={40}
						rx={12}
						fill="none"
						stroke="rgb(214,226,238)"
						strokeWidth={1}
						initial={{ opacity: 0 }}
						animate={{ opacity: [0.08, 0.32, 0.08] }}
						transition={{
							duration: 3,
							delay: 2,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
						}}
					/>
				</motion.g>

				{/* // @ 终点节点：光晕 + 亮核，随本流光点抵达节奏轻轻脉冲 */}
				{ENDPOINTS.map(({ x, pulseDelay, entryDelay }) => (
					<motion.g
						key={x}
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6, delay: entryDelay, ease: "easeOut" }}
						style={{ transformBox: "fill-box", transformOrigin: "center" }}
					>
						<motion.g
							animate={{ scale: [1, 1.28, 1], opacity: [0.8, 1, 0.8] }}
							transition={{
								duration: OUTPUT_DOT_DURATION / 3,
								delay: pulseDelay,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
							style={{ transformBox: "fill-box", transformOrigin: "center" }}
						>
							<circle cx={x} cy={496} r={11} fill="url(#hero-flow-node)" />
							<circle cx={x} cy={496} r={3} fill="rgb(228,234,240)" />
						</motion.g>
					</motion.g>
				))}
			</svg>

			{/* // @ 底部文案：流场立稳后上浮淡入 */}
			<motion.div
				className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-1.5 px-6 text-center"
				initial={{ opacity: 0, y: 14 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 1.7, ease: "easeOut" }}
			>
				<p className="font-semibold text-neutral-200 text-xl">归纳所有 AI 知识</p>
				<p className="text-neutral-500 text-sm">沉淀一次，处处复用</p>
			</motion.div>
		</div>
	);
}

type FlowDotProps = {
	d: string;
	tone: FlowTone;
	/** 滑完全程的时长 */
	duration: number;
	/** 相位延迟：错开同流的其他光点 */
	delay: number;
};

// > 流光光点：光晕 + 亮核两层短亮段（pathLength 0.06）沿路径匀速滑行，两端淡入淡出后循环
function FlowDot({ d, tone, duration, delay }: FlowDotProps): JSX.Element {
	const { base, core } = TONE_COLORS[tone];
	// 两层共用同一份位移/透明度节奏，保证光晕始终包裹亮核
	const dotTransition: Transition = {
		pathOffset: { duration, delay, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
		opacity: {
			duration,
			delay,
			times: [0, 0.1, 0.85, 1],
			repeat: Number.POSITIVE_INFINITY,
			ease: "linear",
		},
	};
	const dotInitial = { pathLength: 0.06, pathOffset: 0, opacity: 0 } as const;
	const dotAnimate: TargetAndTransition = { pathOffset: [0, 0.94], opacity: [0, 1, 1, 0] };

	return (
		<>
			<motion.path
				d={d}
				fill="none"
				stroke={base}
				strokeWidth={7}
				strokeOpacity={0.28}
				strokeLinecap="round"
				initial={dotInitial}
				animate={dotAnimate}
				transition={dotTransition}
			/>
			<motion.path
				d={d}
				fill="none"
				stroke={core}
				strokeWidth={2.6}
				strokeLinecap="round"
				initial={dotInitial}
				animate={dotAnimate}
				transition={dotTransition}
			/>
		</>
	);
}
