"use client";

// # 知识入库：四种知识碎片飞入玻璃库归位（归纳），条目分两轮向三个目标节点发射光流（复用）

import type { Transition } from "motion/react";
import { motion } from "motion/react";
import type { CSSProperties, JSX } from "react";

// @ 主时间轴（秒）：整条叙事共用一个 12s 循环 + 1.5s 间歇，所有关键时刻由此推导
const CYCLE = 12;
const REST = 1.5;
/** 第一枚碎片起飞时刻 */
const CHIP_FIRST = 0.2;
/** 碎片错峰间隔 */
const CHIP_STAGGER = 0.7;
/** 单枚碎片飞行时长 */
const CHIP_FLIGHT = 1.3;
/** 对勾徽章亮起时刻 */
const BADGE_AT = 4.3;
/** 两轮光流发射的起点 */
const ROUND_STARTS = [5.4, 8.1] as const;
/** 三条路线的错峰间隔 */
const ROUTE_STAGGER = 0.18;
/** 光流沿路径滑行的时长 */
const PULSE_TRAVEL = 1.5;
/** 全场淡出起点 */
const FADE_AT = 11.1;

// 把秒换算成 times 归一化刻度
const at = (seconds: number): number => seconds / CYCLE;

type TimelineOptions = {
	times: readonly number[];
	ease?: "easeInOut" | "easeOut" | "linear";
};

// 主时间轴统一 transition：同一 duration 与间歇下无限循环，times 决定元素在轴上的位置
const timeline = ({ times, ease = "easeInOut" }: TimelineOptions): Transition => ({
	duration: CYCLE,
	times: [...times],
	ease,
	repeat: Number.POSITIVE_INFINITY,
	repeatDelay: REST,
});

// @ 画布基准坐标（440 × 640）：HTML 按百分比换算定位，SVG viewBox 用同一坐标系拉伸对齐
const VIEW_W = 440;
const VIEW_H = 640;

const px = (value: number): string => `${(value / VIEW_W) * 100}%`;
const py = (value: number): string => `${(value / VIEW_H) * 100}%`;

// 玻璃库面板与槽位的几何参数（画布坐标）
const PANEL = { x: 40, y: 146, width: 256, height: 220 } as const;
const SLOT = { x: 58, width: 220, height: 26 } as const;
const CHIP_TARGET_X = PANEL.x + PANEL.width / 2;

// 槽位在面板内的绝对定位样式（画布坐标 → 面板内百分比）
const slotStyle = (slotY: number): CSSProperties => ({
	top: `${((slotY - SLOT.height / 2 - PANEL.y) / PANEL.height) * 100}%`,
	left: `${((SLOT.x - PANEL.x) / PANEL.width) * 100}%`,
	width: `${(SLOT.width / PANEL.width) * 100}%`,
	height: SLOT.height,
});

// @ 四枚知识碎片：颜色存 rgb 三元组，方便拼透明度；from/arc 是相对槽位落点的位移偏移
type ChipKind = "doc" | "chat" | "bolt" | "code";

type Chip = {
	kind: ChipKind;
	label: string;
	/** 槽位中心 y（画布坐标） */
	slotY: number;
	fromX: number;
	fromY: number;
	/** 弧线中途偏移，制造弯曲飞行 */
	arcX: number;
	arcY: number;
	/** 起飞倾角（度），落位时收正 */
	tilt: number;
	core: string;
	halo: string;
};

const CHIPS = [
	{
		kind: "doc",
		label: "规约",
		slotY: 202,
		fromX: -138,
		fromY: -172,
		arcX: -56,
		arcY: -96,
		tilt: -18,
		core: "226,232,240",
		halo: "168,180,194",
	},
	{
		kind: "chat",
		label: "提示词",
		slotY: 248,
		fromX: 252,
		fromY: -220,
		arcX: 148,
		arcY: -72,
		tilt: 14,
		core: "203,212,252",
		halo: "134,146,216",
	},
	{
		kind: "bolt",
		label: "技能",
		slotY: 294,
		fromX: -142,
		fromY: 310,
		arcX: -96,
		arcY: 128,
		tilt: 12,
		core: "198,230,238",
		halo: "118,178,198",
	},
	{
		kind: "code",
		label: "代码约定",
		slotY: 340,
		fromX: 248,
		fromY: 268,
		arcX: 132,
		arcY: 94,
		tilt: -14,
		core: "204,232,224",
		halo: "126,178,166",
	},
] as const satisfies readonly Chip[];

// @ 三条分发路线：从面板右缘（x=296）出发的曲线，终点即目标节点中心
type Route = {
	d: string;
	nodeX: number;
	nodeY: number;
	core: string;
	halo: string;
};

const ROUTES = [
	{
		d: "M 296 202 C 340 206 332 280 356 322",
		nodeX: 356,
		nodeY: 322,
		core: "226,232,240",
		halo: "168,180,194",
	},
	{
		d: "M 296 271 C 348 278 352 350 388 404",
		nodeX: 388,
		nodeY: 404,
		core: "203,212,252",
		halo: "134,146,216",
	},
	{
		d: "M 296 340 C 342 352 320 432 352 482",
		nodeX: 352,
		nodeY: 482,
		core: "198,230,238",
		halo: "118,178,198",
	},
] as const satisfies readonly Route[];

// 徽章的 times：全部槽位归位后弹出，淡出点与全场一致
const BADGE_POP_TIMES = [0, at(BADGE_AT), at(BADGE_AT + 0.25), at(BADGE_AT + 0.5), 1] as const;
const BADGE_FADE_TIMES = [0, at(BADGE_AT), at(BADGE_AT + 0.3), at(FADE_AT), 1] as const;

export function HeroIntake(): JSX.Element {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* // @ 环境光晕：静态 blur 冷色垫底，仅进场淡入 */}
			<motion.div
				className="absolute top-[14%] left-[8%] h-80 w-88 rounded-full bg-[rgba(120,138,168,0.16)] blur-3xl"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1.6, ease: "easeOut" }}
			/>
			<motion.div
				className="absolute bottom-[6%] -left-16 size-64 rounded-full bg-[rgba(122,116,180,0.14)] blur-3xl"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1.6, delay: 0.3, ease: "easeOut" }}
			/>

			{/* 浮动包装层：整个场景一起缓慢起伏，保证碎片、光流与面板的几何咬合不散 */}
			<motion.div
				className="absolute inset-0"
				animate={{ y: [0, -4, 0, 4, 0] }}
				transition={{ duration: 6, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
			>
				{/* // @ 玻璃库面板：暗槽位等待碎片归位 */}
				<motion.div
					className="absolute rounded-xl border border-white/10 bg-white/5 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md"
					style={{
						left: px(PANEL.x),
						top: py(PANEL.y),
						width: px(PANEL.width),
						height: py(PANEL.height),
					}}
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
				>
					{/* 顶部受光面高光 */}
					<div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-t-xl bg-gradient-to-b from-white/6 to-transparent" />

					{/* 标题栏：窗点 + 库名 */}
					<div className="flex h-9 items-center gap-1.5 border-white/5 border-b px-3">
						<span className="size-1.5 rounded-full bg-white/10" />
						<span className="size-1.5 rounded-full bg-white/10" />
						<span className="size-1.5 rounded-full bg-white/10" />
						<span className="ml-1.5 text-[10px] text-neutral-500 tracking-widest">
							AI SPEC 知识库
						</span>
					</div>

					{/* // > 对勾徽章：四条全部归位后在面板右上亮起 */}
					<motion.div
						className="absolute top-2 right-2.5 flex size-5 items-center justify-center rounded-full border border-[rgba(168,180,194,0.4)] bg-[rgba(168,180,194,0.15)] shadow-[0_0_12px_rgba(168,180,194,0.35)]"
						initial={{ opacity: 0, scale: 0.5 }}
						animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.5, 0.5, 1.12, 1, 1] }}
						transition={{
							opacity: timeline({ times: BADGE_FADE_TIMES }),
							scale: timeline({ times: BADGE_POP_TIMES, ease: "easeOut" }),
						}}
					>
						<svg className="size-2.5" viewBox="0 0 10 10" fill="none" aria-hidden="true">
							<path
								d="M2 5.2 L4.2 7.4 L8 2.8"
								stroke="rgb(214,226,236)"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</motion.div>

					{/* // @ 四个槽位：暗色凹条 + 归位闪光 + 展开的条目色条 + 条目文字 */}
					{CHIPS.map((chip, index) => {
						const { kind, label, slotY, core, halo } = chip;
						const arrive = CHIP_FIRST + index * CHIP_STAGGER + CHIP_FLIGHT;
						const barTimes = [0, at(arrive), at(arrive + 0.35), at(FADE_AT), 1] as const;
						const flashTimes = [0, at(arrive), at(arrive + 0.1), at(arrive + 0.5), 1] as const;
						const labelTimes = [0, at(arrive + 0.25), at(arrive + 0.55), at(FADE_AT), 1] as const;
						return (
							<div
								key={kind}
								className="absolute rounded-md border border-white/5 bg-black/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
								style={slotStyle(slotY)}
							>
								{/* 归位闪光：碎片“咔哒”落位的瞬间整条槽位亮一下 */}
								<motion.div
									className="absolute inset-0 rounded-md"
									style={{ backgroundColor: `rgba(${halo},0.4)` }}
									initial={{ opacity: 0 }}
									animate={{ opacity: [0, 0, 0.8, 0, 0] }}
									transition={timeline({ times: flashTimes, ease: "easeOut" })}
								/>
								{/* 条目色条：从左向右展开，淡出时保持长度只降透明度 */}
								<motion.div
									className="absolute inset-1 origin-left rounded-sm border"
									style={{
										borderColor: `rgba(${halo},0.45)`,
										background: `linear-gradient(90deg, rgba(${halo},0.34), rgba(${halo},0.1))`,
										boxShadow: `0 0 10px rgba(${halo},0.25)`,
									}}
									initial={{ scaleX: 0, opacity: 0 }}
									animate={{ scaleX: [0, 0, 1, 1, 1], opacity: [0, 0, 1, 1, 0] }}
									transition={timeline({ times: barTimes, ease: "easeOut" })}
								/>
								{/* 条目文字与亮点：晚于色条一拍浮现，避免被 scaleX 拉伸 */}
								<motion.div
									className="absolute inset-y-0 left-2.5 flex items-center gap-1.5"
									initial={{ opacity: 0 }}
									animate={{ opacity: [0, 0, 1, 1, 0] }}
									transition={timeline({ times: labelTimes })}
								>
									<span
										className="size-1 rounded-full"
										style={{ backgroundColor: `rgb(${core})` }}
									/>
									<span className="text-[9px] tracking-wider" style={{ color: `rgb(${core})` }}>
										{label}
									</span>
								</motion.div>
							</div>
						);
					})}
				</motion.div>

				{/* // @ 分发光流：SVG 与 HTML 共用 440×640 坐标系，preserveAspectRatio=none 保证端点对齐 */}
				<svg
					className="pointer-events-none absolute inset-0 h-full w-full"
					viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
					preserveAspectRatio="none"
					role="img"
					aria-label="库中条目分两轮沿曲线光流分发到三个目标节点"
				>
					{/* 静态虚线路径：先把分发网络的骨架淡淡画出来 */}
					{ROUTES.map(({ d }) => (
						<path
							key={d}
							d={d}
							fill="none"
							stroke="rgba(168,180,194,0.08)"
							strokeWidth={1}
							strokeDasharray="3 5"
							vectorEffect="non-scaling-stroke"
						/>
					))}

					{/* // > 光流：短亮段（pathLength 0.18）沿曲线从库滑向节点，两轮 × 三路错峰发射 */}
					{ROUND_STARTS.map((roundStart) =>
						ROUTES.map(({ d, core }, routeIndex) => {
							const launch = roundStart + routeIndex * ROUTE_STAGGER;
							const offsetTimes = [0, at(launch), at(launch + PULSE_TRAVEL), 1] as const;
							const glowTimes = [
								0,
								at(launch),
								at(launch + 0.2),
								at(launch + PULSE_TRAVEL - 0.2),
								at(launch + PULSE_TRAVEL + 0.05),
								1,
							] as const;
							return (
								<motion.path
									key={`round-${roundStart}-${d}`}
									d={d}
									fill="none"
									stroke={`rgb(${core})`}
									strokeWidth={1.6}
									strokeLinecap="round"
									vectorEffect="non-scaling-stroke"
									initial={{ pathLength: 0.18, pathOffset: 0, opacity: 0 }}
									animate={{ pathOffset: [0, 0, 0.82, 0.82], opacity: [0, 0, 1, 1, 0, 0] }}
									transition={{
										pathOffset: timeline({ times: offsetTimes }),
										opacity: timeline({ times: glowTimes }),
									}}
								/>
							);
						}),
					)}
				</svg>

				{/* // @ 三个目标节点：被光流击中时弹跳并点亮同色小点，第二轮命中后浮出 ×2 */}
				{ROUTES.map(({ d, nodeX, nodeY, core, halo }, routeIndex) => {
					const hit1 = ROUND_STARTS[0] + routeIndex * ROUTE_STAGGER + PULSE_TRAVEL;
					const hit2 = ROUND_STARTS[1] + routeIndex * ROUTE_STAGGER + PULSE_TRAVEL;
					const popTimes = [
						0,
						at(hit1),
						at(hit1 + 0.12),
						at(hit1 + 0.35),
						at(hit2),
						at(hit2 + 0.12),
						at(hit2 + 0.35),
						1,
					] as const;
					const dotTimes = [
						0,
						at(hit1),
						at(hit1 + 0.15),
						at(hit2),
						at(hit2 + 0.15),
						at(FADE_AT),
						1,
					] as const;
					const tagTimes = [0, at(hit2 + 0.2), at(hit2 + 0.55), at(FADE_AT), 1] as const;
					return (
						<div
							key={d}
							className="absolute"
							style={{ left: px(nodeX), top: py(nodeY), marginLeft: -16, marginTop: -16 }}
						>
							{/* 节点外壳：常驻的迷你玻璃方块，命中时 scale 脉冲 */}
							<motion.div
								className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/5 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)] backdrop-blur-sm"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1, scale: [1, 1, 1.16, 1, 1, 1.16, 1, 1] }}
								transition={{
									opacity: { duration: 0.8, delay: 0.9 + routeIndex * 0.15, ease: "easeOut" },
									scale: timeline({ times: popTimes, ease: "easeOut" }),
								}}
							>
								{/* 未点亮时的暗点 */}
								<span className="col-start-1 row-start-1 size-1.5 rounded-full bg-white/15" />
								{/* 点亮后的同色亮点：第一轮亮起，第二轮再度提亮 */}
								<motion.span
									className="col-start-1 row-start-1 size-1.5 rounded-full"
									style={{
										backgroundColor: `rgb(${core})`,
										boxShadow: `0 0 8px rgba(${halo},0.6)`,
									}}
									initial={{ opacity: 0 }}
									animate={{ opacity: [0, 0, 1, 0.55, 1, 1, 0] }}
									transition={timeline({ times: dotTimes })}
								/>
							</motion.div>
							{/* ×2 标记：第二轮命中后浮现，传达“同一座库反复复用” */}
							<motion.span
								className="absolute top-1/2 -right-5 text-[10px] text-neutral-500"
								style={{ marginTop: -7 }}
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: [0, 0, 1, 1, 0], y: [4, 4, 0, 0, 0] }}
								transition={timeline({ times: tagTimes, ease: "easeOut" })}
							>
								×2
							</motion.span>
						</div>
					);
				})}

				{/* // @ 知识碎片：四角错峰起飞，走弧线收正倾角，落位瞬间缩小淡出 */}
				{CHIPS.map((chip, index) => {
					const { kind, slotY, fromX, fromY, arcX, arcY, tilt, core, halo } = chip;
					const start = CHIP_FIRST + index * CHIP_STAGGER;
					const arrive = start + CHIP_FLIGHT;
					// 位移/倾角/缩放共用一组 times：静止—起飞—弧线中途—到达—保持
					const moveTimes = [0, at(start), at(start + CHIP_FLIGHT * 0.55), at(arrive), 1] as const;
					const fadeTimes = [
						0,
						at(start),
						at(start + 0.25),
						at(arrive - 0.08),
						at(arrive + 0.15),
						1,
					] as const;
					return (
						<motion.div
							key={kind}
							className="absolute flex size-9 items-center justify-center rounded-lg bg-white/5 backdrop-blur-sm"
							style={{
								left: px(CHIP_TARGET_X),
								top: py(slotY),
								marginLeft: -18,
								marginTop: -18,
								border: `1px solid rgba(${halo},0.4)`,
								boxShadow: `0 0 18px rgba(${halo},0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
							}}
							initial={{ x: fromX, y: fromY, rotate: tilt, scale: 0.9, opacity: 0 }}
							animate={{
								x: [fromX, fromX, arcX, 0, 0],
								y: [fromY, fromY, arcY, 0, 0],
								rotate: [tilt, tilt, tilt * 0.35, 0, 0],
								scale: [0.9, 0.9, 1.04, 0.82, 0.82],
								opacity: [0, 0, 1, 1, 0, 0],
							}}
							transition={{
								x: timeline({ times: moveTimes }),
								y: timeline({ times: moveTimes }),
								rotate: timeline({ times: moveTimes }),
								scale: timeline({ times: moveTimes }),
								opacity: timeline({ times: fadeTimes }),
							}}
						>
							<ChipIcon kind={kind} core={core} />
						</motion.div>
					);
				})}
			</motion.div>

			{/* // @ 底部文案：进场上浮淡入 */}
			<motion.div
				className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-1.5 px-6 text-center"
				initial={{ opacity: 0, y: 14 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}
			>
				<p className="font-semibold text-neutral-200 text-xl">归纳所有 AI 知识</p>
				<p className="text-neutral-500 text-sm">沉淀一次，处处复用</p>
			</motion.div>
		</div>
	);
}

type ChipIconProps = {
	kind: ChipKind;
	/** rgb 三元组，用作描边色 */
	core: string;
};

// 碎片内的简笔图标：文档（规约）/ 对话气泡（提示词）/ 闪电（技能）/ 代码括号（代码约定）
function ChipIcon({ kind, core }: ChipIconProps): JSX.Element {
	const stroke = `rgb(${core})`;
	return (
		<svg className="size-4.5" viewBox="0 0 18 18" fill="none" aria-hidden="true">
			{kind === "doc" && (
				<>
					<rect x="4.5" y="2.5" width="9" height="13" rx="2" stroke={stroke} strokeWidth="1.3" />
					<line
						x1="7"
						y1="7"
						x2="11"
						y2="7"
						stroke={stroke}
						strokeWidth="1.3"
						strokeLinecap="round"
					/>
					<line
						x1="7"
						y1="10"
						x2="11"
						y2="10"
						stroke={stroke}
						strokeWidth="1.3"
						strokeLinecap="round"
					/>
				</>
			)}
			{kind === "chat" && (
				<path
					d="M5.4 3.6 h7.2 a1.9 1.9 0 0 1 1.9 1.9 v3.4 a1.9 1.9 0 0 1 -1.9 1.9 H8.6 l-2.7 2.6 v-2.6 h-.4 a1.9 1.9 0 0 1 -1.9 -1.9 V5.5 a1.9 1.9 0 0 1 1.8 -1.9 z"
					stroke={stroke}
					strokeWidth="1.3"
					strokeLinejoin="round"
				/>
			)}
			{kind === "bolt" && (
				<path
					d="M9.8 2.5 L5 10 h3.4 L8 15.5 L13 8 h-3.4 z"
					stroke={stroke}
					strokeWidth="1.2"
					strokeLinejoin="round"
				/>
			)}
			{kind === "code" && (
				<>
					<path
						d="M6 5.5 L2.8 9 L6 12.5"
						stroke={stroke}
						strokeWidth="1.3"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<path
						d="M12 5.5 L15.2 9 L12 12.5"
						stroke={stroke}
						strokeWidth="1.3"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<line
						x1="10.3"
						y1="4"
						x2="7.7"
						y2="14"
						stroke={stroke}
						strokeWidth="1.3"
						strokeLinecap="round"
					/>
				</>
			)}
		</svg>
	);
}
