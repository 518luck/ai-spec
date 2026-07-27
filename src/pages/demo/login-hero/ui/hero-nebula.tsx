"use client";

// # 聚核辐射：光屑自四方螺旋汇入中央凝成亮核，核心三度辐射涟漪、依次点亮绕行卫星，底部落文案

import { motion } from "motion/react";
import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";

// @ 主时间轴：单轮 11s（含尾部约 1.2s 间歇），所有叙事元素共用同一 duration，times 由秒标推导
const DURATION = 11;
// 叙事循环整体延后启动，给进场动画让路
const NARRATIVE_DELAY = 1;
// 全场收光的起止秒标：辐射结束后一起淡出，再静场到循环结束
const FADE_START = 9.3;
const FADE_END = 9.8;

// 秒标列表换算成 motion 的 times（0~1）
const toTimes = (seconds: readonly number[]): number[] =>
	seconds.map((second) => second / DURATION);

type NarrativeEase = "linear" | "easeIn" | "easeOut" | "easeInOut";

type NarrativeTransitionOptions = {
	seconds: readonly number[];
	ease?: NarrativeEase;
};

// 把秒标列表包装成与主时间轴同步的无限循环 transition
const narrativeTransition = ({ seconds, ease = "easeInOut" }: NarrativeTransitionOptions) => ({
	duration: DURATION,
	times: toTimes(seconds),
	ease,
	repeat: Number.POSITIVE_INFINITY,
	delay: NARRATIVE_DELAY,
});

// @ 冷色系四色：亮核接近白、光晕取低饱和冷色（银蓝 / 灰紫 / 冷青 / 灰蓝绿）
type MoteTone = "silver" | "violet" | "cyan" | "teal";

const TONES: Record<MoteTone, { core: string; halo: string }> = {
	silver: { core: "rgb(226,232,240)", halo: "rgba(168,180,194,0.55)" },
	violet: { core: "rgb(214,210,240)", halo: "rgba(150,144,200,0.55)" },
	cyan: { core: "rgb(200,229,238)", halo: "rgba(118,178,198,0.55)" },
	teal: { core: "rgb(202,230,222)", halo: "rgba(126,178,166,0.55)" },
};

// @ 第一幕·聚合：光屑从四周沿三段拐点弧线螺旋收拢，抵达即被核心吸收

type Mote = {
	/** 出发点（相对核心中心的偏移） */
	fromX: number;
	fromY: number;
	/** 弧线中途拐点 */
	viaX: number;
	viaY: number;
	/** 临近核心的收拢拐点 */
	bendX: number;
	bendY: number;
	/** 启程秒标与航程时长，错峰出发 */
	start: number;
	travel: number;
	size: number;
	tone: MoteTone;
};

const MOTES = [
	{
		fromX: -250,
		fromY: -215,
		viaX: -95,
		viaY: -165,
		bendX: 45,
		bendY: -60,
		start: 0,
		travel: 2.5,
		size: 3,
		tone: "silver",
	},
	{
		fromX: 65,
		fromY: -270,
		viaX: 150,
		viaY: -140,
		bendX: 60,
		bendY: 40,
		start: 0.2,
		travel: 2.3,
		size: 2,
		tone: "violet",
	},
	{
		fromX: 245,
		fromY: -175,
		viaX: 190,
		viaY: -25,
		bendX: 40,
		bendY: 70,
		start: 0.35,
		travel: 2.6,
		size: 4,
		tone: "cyan",
	},
	{
		fromX: 280,
		fromY: 40,
		viaX: 150,
		viaY: 130,
		bendX: -30,
		bendY: 85,
		start: 0.5,
		travel: 2.4,
		size: 2.5,
		tone: "teal",
	},
	{
		fromX: 215,
		fromY: 235,
		viaX: 60,
		viaY: 220,
		bendX: -70,
		bendY: 60,
		start: 0.65,
		travel: 2.2,
		size: 3.5,
		tone: "silver",
	},
	{
		fromX: 40,
		fromY: 320,
		viaX: -110,
		viaY: 230,
		bendX: -80,
		bendY: -30,
		start: 0.8,
		travel: 2.5,
		size: 2,
		tone: "cyan",
	},
	{
		fromX: -190,
		fromY: 285,
		viaX: -215,
		viaY: 110,
		bendX: -60,
		bendY: -60,
		start: 0.95,
		travel: 2.3,
		size: 5,
		tone: "violet",
	},
	{
		fromX: -285,
		fromY: 90,
		viaX: -160,
		viaY: -60,
		bendX: 10,
		bendY: -80,
		start: 1.1,
		travel: 2.6,
		size: 3,
		tone: "teal",
	},
	{
		fromX: -140,
		fromY: -260,
		viaX: -30,
		viaY: -130,
		bendX: 70,
		bendY: -25,
		start: 1.2,
		travel: 2.4,
		size: 2.5,
		tone: "cyan",
	},
	{
		fromX: 175,
		fromY: -240,
		viaX: 210,
		viaY: -80,
		bendX: 90,
		bendY: 55,
		start: 1.3,
		travel: 2.2,
		size: 4,
		tone: "silver",
	},
	{
		fromX: 270,
		fromY: 155,
		viaX: 110,
		viaY: 190,
		bendX: -50,
		bendY: 105,
		start: 1.4,
		travel: 2.5,
		size: 2,
		tone: "violet",
	},
	{
		fromX: -260,
		fromY: 205,
		viaX: -130,
		viaY: 190,
		bendX: -100,
		bendY: 25,
		start: 1.5,
		travel: 2.3,
		size: 3,
		tone: "teal",
	},
] as const satisfies readonly Mote[];

// 充能层：光屑分三批抵达（约 2.5s / 3.2s / 3.9s），核心亮度逐阶上抬，凝实瞬间冲顶后回落
const CHARGE_SECONDS = [0, 2.5, 2.8, 3.2, 3.5, 3.9, 4.15, 4.3, 4.6, FADE_START, FADE_END, DURATION];
const CHARGE_OPACITIES = [0, 0, 0.28, 0.28, 0.5, 0.5, 0.75, 1, 0.7, 0.7, 0, 0];

// 凝实脉冲：全部汇入后核心短促收缩再回弹
const CONDENSE_SECONDS = [0, 4.1, 4.3, 4.5, 4.7, DURATION];
const CONDENSE_SCALES = [1, 1, 0.92, 1.06, 1, 1];

// 凝实亮环：一圈锐利细环随凝实荡开
const BURST_SECONDS = [0, 4.3, 4.42, 5.2, DURATION];
const BURST_OPACITIES = [0, 0, 0.75, 0, 0];
const BURST_SCALES = [0.4, 0.4, 0.52, 1.6, 1.6];

// @ 第二幕·辐射：核心连续荡开三圈涟漪，一次比一次亮

type RippleWave = {
	/** 发射秒标 */
	start: number;
	/** 峰值透明度，逐次递增 */
	peak: number;
};

const RIPPLE_WAVES = [
	{ start: 4.9, peak: 0.32 },
	{ start: 6.3, peak: 0.44 },
	{ start: 7.7, peak: 0.56 },
] as const satisfies readonly RippleWave[];

// 涟漪单圈扩散时长与缩放轨迹（基圈 176px，1.8 倍恰好扫出外圈轨道）
const RIPPLE_TRAVEL = 1.5;
const RIPPLE_SCALES = [0.3, 0.3, 0.45, 1.8, 1.8];

// 辐射余晖层：每次发射时核心先亮后落，底光逐次抬高，收场统一淡出
const RADIANCE_SECONDS = [0, 4.85, 5.05, 6.25, 6.45, 7.65, 7.85, 9, FADE_START, FADE_END, DURATION];
const RADIANCE_OPACITIES = [0, 0, 0.35, 0.18, 0.5, 0.3, 0.7, 0.45, 0.45, 0, 0];

// 涟漪从核心扩散到内 / 外圈轨道的耗时，推导卫星被点亮的秒标
const INNER_REACH = 0.55;
const OUTER_REACH = 1;
const INNER_HITS = RIPPLE_WAVES.map(({ start }) => start + INNER_REACH);
const OUTER_HITS = RIPPLE_WAVES.map(({ start }) => start + OUTER_REACH);

// 每次命中展开为「起亮—峰值—回落」三个秒标
const hitTriplets = (hits: readonly number[]): number[] =>
	hits.flatMap((hit) => [hit, hit + 0.15, hit + 0.5]);

// 卫星亮点的秒标（含收场淡出）与透明度：三次点亮后底亮累积，最后归零
const flashSeconds = (hits: readonly number[]): number[] => [
	0,
	...hitTriplets(hits),
	FADE_START,
	FADE_END,
	DURATION,
];
const FLASH_OPACITIES = [0, 0, 0.9, 0.3, 0.3, 1, 0.5, 0.5, 1, 0.7, 0.7, 0, 0];

// 卫星本体的脉冲秒标与缩放：被涟漪扫过时短促放大
const pulseSeconds = (hits: readonly number[]): number[] => [0, ...hitTriplets(hits), DURATION];
const PULSE_SCALES = [1, 1, 1.45, 1, 1, 1.45, 1, 1, 1.45, 1, 1];

// @ 轨道与卫星：两圈虚线轨道反向绕行，各钉两颗玻璃卫星

type OrbitConfig = {
	/** 轨道环与旋转包装层共用的尺寸类 */
	sizeClassName: string;
	/** 绕行周期（秒），两圈错开避免同步 */
	spinDuration: number;
	fromRotate: number;
	toRotate: number;
	entryDelay: number;
	hits: readonly number[];
	tones: readonly [MoteTone, MoteTone];
};

const ORBITS = [
	{
		sizeClassName: "size-50",
		spinDuration: 14,
		fromRotate: 40,
		toRotate: 400,
		entryDelay: 1.05,
		hits: INNER_HITS,
		tones: ["silver", "cyan"],
	},
	{
		sizeClassName: "size-70",
		spinDuration: 20,
		fromRotate: 210,
		toRotate: -150,
		entryDelay: 1.25,
		hits: OUTER_HITS,
		tones: ["violet", "teal"],
	},
] as const satisfies readonly OrbitConfig[];

// @ 环境点缀：四角微星点错相位闪烁

type AmbientStar = {
	className: string;
	duration: number;
	delay: number;
};

const AMBIENT_STARS = [
	{ className: "top-[9%] left-[11%] size-1", duration: 3.6, delay: 0.4 },
	{ className: "top-[14%] right-[12%] size-0.5", duration: 4.4, delay: 1.6 },
	{ className: "bottom-[30%] left-[8%] size-0.5", duration: 3.2, delay: 2.4 },
	{ className: "bottom-[26%] right-[9%] size-1", duration: 5, delay: 0.9 },
] as const satisfies readonly AmbientStar[];

export function HeroNebula(): JSX.Element {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* // @ 静态环境光：底部左右两小团灰紫 / 冷青光斑，进场即在 */}
			<div className="absolute -bottom-10 -left-16 size-56 rounded-full bg-[rgba(120,112,180,0.12)] blur-3xl" />
			<div className="absolute -right-14 bottom-6 size-48 rounded-full bg-[rgba(94,150,168,0.12)] blur-3xl" />

			{/* 四角微星点：各自独立周期闪烁 */}
			{AMBIENT_STARS.map(({ className, duration, delay }) => (
				<motion.div
					key={className}
					className={cn("absolute rounded-full bg-[#dbe3ec]", className)}
					animate={{ opacity: [0.1, 0.65, 0.1] }}
					transition={{ duration, delay, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
				/>
			))}

			{/* 舞台：所有同心图层叠进同一网格单元，天然对齐圆心，动画只动 transform / opacity */}
			<div className="absolute top-[42%] left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center">
				{/* 核心背后的大团静态银蓝光晕，进场即在 */}
				<div className="col-start-1 row-start-1 size-80 rounded-full bg-[#5f6da6]/16 blur-3xl" />

				{/* // @ 轨道层：虚线环错峰展开 + 旋转包装层带卫星反向绕行 */}
				{ORBITS.map(({ sizeClassName, entryDelay }) => (
					<motion.div
						key={sizeClassName}
						className={cn(
							"col-start-1 row-start-1 rounded-full border border-[#a8b4c2]/12 border-dashed",
							sizeClassName,
						)}
						initial={{ opacity: 0, scale: 0.82 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.9, ease: "easeOut", delay: entryDelay - 0.3 }}
					/>
				))}
				{/* // > 卫星绕行用旋转包装层：包装层匀速自转，卫星钉在边缘中点即走出圆轨，独立于主时间轴 */}
				{ORBITS.map((orbit) => {
					const { sizeClassName, spinDuration, fromRotate, toRotate, entryDelay, hits, tones } =
						orbit;
					return (
						<motion.div
							key={sizeClassName}
							className={cn("col-start-1 row-start-1", sizeClassName)}
							initial={{ rotate: fromRotate }}
							animate={{ rotate: toRotate }}
							transition={{
								duration: spinDuration,
								ease: "linear",
								repeat: Number.POSITIVE_INFINITY,
							}}
						>
							<GlassSatellite
								pinClassName="top-0 left-1/2"
								hits={hits}
								tone={tones[0]}
								entryDelay={entryDelay}
							/>
							<GlassSatellite
								pinClassName="top-full left-1/2"
								hits={hits}
								tone={tones[1]}
								entryDelay={entryDelay + 0.15}
							/>
						</motion.div>
					);
				})}

				{/* // @ 第二幕：三圈涟漪按主时间轴依次荡开，峰值透明度逐次递增 */}
				{RIPPLE_WAVES.map(({ start, peak }) => (
					<motion.div
						key={start}
						className="col-start-1 row-start-1 size-44 rounded-full border border-[#b9c6d6] shadow-[0_0_18px_rgba(168,180,194,0.3),inset_0_0_18px_rgba(168,180,194,0.2)]"
						animate={{
							opacity: [0, 0, peak, 0, 0],
							scale: RIPPLE_SCALES,
						}}
						transition={narrativeTransition({
							seconds: [0, start, start + 0.12, start + RIPPLE_TRAVEL, DURATION],
							ease: "easeOut",
						})}
					/>
				))}

				{/* 凝实亮环：光屑全部汇入后荡开一圈锐利细环 */}
				<motion.div
					className="col-start-1 row-start-1 size-44 rounded-full border-2 border-[#dfe8f2]"
					animate={{ opacity: BURST_OPACITIES, scale: BURST_SCALES }}
					transition={narrativeTransition({ seconds: BURST_SECONDS, ease: "easeOut" })}
				/>

				{/* // @ 第一幕：光屑错峰启程，沿拐点弧线螺旋收拢，抵达即淡出被核心吸收 */}
				{MOTES.map((mote) => {
					const { fromX, fromY, viaX, viaY, bendX, bendY, start, travel, size, tone } = mote;
					const { core, halo } = TONES[tone];
					return (
						<motion.div
							key={`${fromX}-${fromY}`}
							className="col-start-1 row-start-1 rounded-full"
							style={{
								width: size,
								height: size,
								backgroundColor: core,
								boxShadow: `0 0 ${size * 3}px ${size}px ${halo}`,
							}}
							animate={{
								x: [fromX, fromX, viaX, bendX, 0, 0],
								y: [fromY, fromY, viaY, bendY, 0, 0],
								opacity: [0, 0, 1, 1, 0, 0],
							}}
							transition={narrativeTransition({
								seconds: [
									0,
									start,
									start + travel * 0.4,
									start + travel * 0.75,
									start + travel,
									DURATION,
								],
							})}
						/>
					);
				})}

				{/* 核心进场：从 scale 0.6 淡入弹定，之后由主时间轴接管凝实与亮度 */}
				<motion.div
					className="col-start-1 row-start-1"
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{
						type: "spring",
						stiffness: 180,
						damping: 17,
						delay: 0.25,
						opacity: { duration: 0.5, ease: "easeOut", delay: 0.25 },
					}}
				>
					{/* 凝实脉冲：收缩回弹只作用于核心球体 */}
					<motion.div
						className="grid place-items-center"
						animate={{ scale: CONDENSE_SCALES }}
						transition={narrativeTransition({ seconds: CONDENSE_SECONDS })}
					>
						{/* 多层发光球：静态光晕垫底、中层冷色渐变、两层动态亮度、顶层亮核 */}
						<div className="col-start-1 row-start-1 size-24 rounded-full bg-[#a8b4c2]/18 blur-2xl" />
						<div className="col-start-1 row-start-1 size-12 rounded-full bg-[radial-gradient(circle_at_35%_32%,rgba(222,232,242,0.85),rgba(140,152,206,0.4)_58%,rgba(140,152,206,0)_78%)]" />
						{/* 充能层：光屑每批汇入亮一阶 */}
						<motion.div
							className="col-start-1 row-start-1 size-14 rounded-full bg-[#d8e2ee] blur-md"
							animate={{ opacity: CHARGE_OPACITIES }}
							transition={narrativeTransition({ seconds: CHARGE_SECONDS })}
						/>
						{/* 辐射余晖层：三次发射逐次更亮，收场统一淡出 */}
						<motion.div
							className="col-start-1 row-start-1 size-18 rounded-full bg-[#cfdeed] blur-lg"
							animate={{ opacity: RADIANCE_OPACITIES }}
							transition={narrativeTransition({ seconds: RADIANCE_SECONDS })}
						/>
						<div className="col-start-1 row-start-1 size-5 rounded-full bg-[#eef3f9] shadow-[0_0_18px_6px_rgba(196,208,222,0.55)]" />
					</motion.div>
				</motion.div>
			</div>

			{/* // @ 底部文案：进场时上浮淡入 */}
			<motion.div
				className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-1.5 px-6 text-center"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, ease: "easeOut", delay: 1.4 }}
			>
				<p className="font-semibold text-neutral-200 text-xl">归纳所有 AI 知识</p>
				<p className="text-neutral-500 text-sm">沉淀一次，处处复用</p>
			</motion.div>
		</div>
	);
}

type GlassSatelliteProps = {
	/** 钉在旋转包装层边缘的定位类 */
	pinClassName: string;
	/** 涟漪抵达该轨道的秒标列表 */
	hits: readonly number[];
	tone: MoteTone;
	entryDelay: number;
};

// 玻璃小卫星：半透明方块内含暗色小点，被涟漪扫过时亮点浮现并短促放大，三次后底亮累积
function GlassSatellite({
	pinClassName,
	hits,
	tone,
	entryDelay,
}: GlassSatelliteProps): JSX.Element {
	const { core, halo } = TONES[tone];
	return (
		<motion.div
			className={cn("absolute -translate-x-1/2 -translate-y-1/2", pinClassName)}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.8, ease: "easeOut", delay: entryDelay }}
		>
			{/* 主时间轴脉冲：与涟漪到达时刻对齐的短促放大 */}
			<motion.div
				className="relative grid size-3.5 place-items-center rounded-[5px] border border-white/20 bg-white/10 shadow-[0_0_10px_rgba(168,180,194,0.25)] backdrop-blur-sm"
				animate={{ scale: PULSE_SCALES }}
				transition={narrativeTransition({ seconds: pulseSeconds(hits), ease: "easeOut" })}
			>
				<span className="size-1 rounded-full bg-neutral-600" />
				{/* 点亮层：亮色小点覆盖暗点，透明度按三次命中逐级抬升，收场归零 */}
				<motion.span
					className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
					style={{ backgroundColor: core, boxShadow: `0 0 8px 2px ${halo}` }}
					animate={{ opacity: FLASH_OPACITIES }}
					transition={narrativeTransition({ seconds: flashSeconds(hits), ease: "easeOut" })}
				/>
			</motion.div>
		</motion.div>
	);
}
