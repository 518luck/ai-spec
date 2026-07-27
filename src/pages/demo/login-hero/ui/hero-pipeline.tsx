"use client";

// # 登录侧板候选：归纳复用全流程 —— 第一幕原样复刻「知识入库」（碎片入库、分发点亮），第二幕三扇疾书弹窗压层覆盖
// > 时序用步进状态机：上一步计时不结束下一步不开始，库 → 节点 → 弹窗的递进在结构上保证

import { motion } from "motion/react";
import { type CSSProperties, type JSX, useEffect, useState } from "react";

// @ 演出序列：每步停留时长（秒），走完一轮内容区重挂载重演
const SEQUENCE = [
	{ key: "start", hold: 0.3 },
	{ key: "library", hold: 0.5 },
	{ key: "intake", hold: 1.7 },
	{ key: "badge", hold: 0.55 },
	{ key: "beams", hold: 0.95 },
	{ key: "windows", hold: 0.95 },
	{ key: "stream", hold: 2.4 },
	{ key: "seal", hold: 1.9 },
	{ key: "fade", hold: 1 },
] as const;

type SequenceKey = (typeof SEQUENCE)[number]["key"];

// 按名字取步骤序号
const stepIndexOf = (key: SequenceKey): number => SEQUENCE.findIndex((s) => s.key === key);

const STEP_LIBRARY = stepIndexOf("library");
const STEP_INTAKE = stepIndexOf("intake");
const STEP_BADGE = stepIndexOf("badge");
const STEP_BEAMS = stepIndexOf("beams");
const STEP_WINDOWS = stepIndexOf("windows");
const STEP_STREAM = stepIndexOf("stream");
const STEP_SEAL = stepIndexOf("seal");
const STEP_FADE = stepIndexOf("fade");

// 碎片飞行、光流与弹窗书写的节奏参数（秒）
const CHIP_STAGGER = 0.35;
const CHIP_FLIGHT = 0.65;
const BEAM_STAGGER = 0.2;
const ROW_STAGGER = 0.35;
const WINDOW_STAGGER = 0.25;

// @ 画布基准坐标（440 × 640）：HTML 按百分比换算定位，SVG viewBox 用同一坐标系拉伸对齐（与「知识入库」一致）
const VIEW_W = 440;
const VIEW_H = 640;

const px = (value: number): string => `${(value / VIEW_W) * 100}%`;
const py = (value: number): string => `${(value / VIEW_H) * 100}%`;

// 玻璃库面板与槽位的几何参数（画布坐标，与「知识入库」一致）
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

// 终端弹窗的层叠位置：作为第二图层压在知识库上方，彼此错位、露出库的边缘不全盖住
const WINDOW_POSITIONS = [
	{ left: "2.5%", top: "18.5%" },
	{ left: "31%", top: "31%" },
	{ left: "9%", top: "44.5%" },
] as const;

type StepLoop = { step: number; runId: number };

// 步进循环：当前步计时结束才推进；走完整轮换 runId 重挂载内容区
const useStepLoop = (): StepLoop => {
	const [loop, setLoop] = useState<StepLoop>({ step: 0, runId: 0 });

	useEffect(() => {
		const finished = loop.step >= SEQUENCE.length;
		const current = SEQUENCE[loop.step];
		const delayMs = finished || !current ? 60 : current.hold * 1000;
		const timer = setTimeout(() => {
			setLoop((previous) =>
				finished
					? { step: 0, runId: previous.runId + 1 }
					: { ...previous, step: previous.step + 1 },
			);
		}, delayMs);
		return () => clearTimeout(timer);
	}, [loop]);

	return loop;
};

export function HeroPipeline(): JSX.Element {
	const { step, runId } = useStepLoop();

	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* 背景光晕：与「知识入库」同款的两团冷色辉光 */}
			<div className="absolute top-[14%] left-[8%] h-80 w-88 rounded-full bg-[rgba(120,138,168,0.16)] blur-3xl" />
			<div className="absolute bottom-[6%] -left-16 size-64 rounded-full bg-[rgba(122,116,180,0.14)] blur-3xl" />

			{/* 内容区：key 绑 runId 每轮重演 */}
			<motion.div
				key={runId}
				className="absolute inset-0"
				initial={{ opacity: 0 }}
				animate={{ opacity: step >= STEP_FADE ? 0 : 1 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			>
				{/* // @ 玻璃库面板：与「知识入库」同几何同样式，暗槽位等待碎片归位 */}
				<motion.div
					className="absolute z-10 rounded-xl border border-white/10 bg-white/5 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md"
					style={{
						left: px(PANEL.x),
						top: py(PANEL.y),
						width: px(PANEL.width),
						height: py(PANEL.height),
					}}
					initial={{ opacity: 0, scale: 0.96 }}
					animate={step >= STEP_LIBRARY ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
				>
					{/* 顶部受光面高光 */}
					<div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-t-xl bg-linear-to-b from-white/6 to-transparent" />

					{/* 标题栏：三点窗控 + 库名 */}
					<div className="flex h-9 items-center gap-1.5 border-white/5 border-b px-3">
						<span className="size-1.5 rounded-full bg-white/10" />
						<span className="size-1.5 rounded-full bg-white/10" />
						<span className="size-1.5 rounded-full bg-white/10" />
						<span className="ml-1.5 font-medium text-[10px] text-neutral-400 tracking-wider">
							AI SPEC 知识库
						</span>
					</div>

					{/* 集齐对勾：四条入库后弹出的发光徽章 */}
					<motion.span
						className="absolute top-2 right-2.5 flex size-5 items-center justify-center rounded-full border border-[rgba(168,180,194,0.4)] bg-[rgba(168,180,194,0.15)] text-[9px] text-[rgb(198,212,226)] shadow-[0_0_12px_rgba(168,180,194,0.35)]"
						initial={{ opacity: 0, scale: 0.5 }}
						animate={step >= STEP_BADGE ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
					>
						✓
					</motion.span>

					{/* // @ 四个槽位：暗色凹条 + 归位闪光 + 展开的条目色条 + 条目文字 */}
					{CHIPS.map((chip, index) => {
						const arriveDelay = index * CHIP_STAGGER + CHIP_FLIGHT * 0.85;
						return (
							<div
								key={chip.kind}
								className="absolute rounded-md border border-white/5 bg-black/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
								style={slotStyle(chip.slotY)}
							>
								{/* 归位闪光：碎片"咔哒"落位的瞬间整条槽位亮一下 */}
								<motion.div
									className="absolute inset-0 rounded-md"
									style={{ backgroundColor: `rgba(${chip.halo},0.4)` }}
									initial={{ opacity: 0 }}
									animate={step >= STEP_INTAKE ? { opacity: [0, 0.8, 0] } : { opacity: 0 }}
									transition={
										step >= STEP_INTAKE
											? { duration: 0.5, delay: arriveDelay, times: [0, 0.2, 1], ease: "easeOut" }
											: { duration: 0 }
									}
								/>
								{/* 条目色条：带光晕的渐变条从左向右展开 */}
								<motion.div
									className="absolute inset-1 origin-left rounded-sm border"
									style={{
										borderColor: `rgba(${chip.halo},0.45)`,
										background: `linear-gradient(90deg, rgba(${chip.halo},0.34), rgba(${chip.halo},0.1))`,
										boxShadow: `0 0 10px rgba(${chip.halo},0.25)`,
									}}
									initial={{ scaleX: 0, opacity: 0 }}
									animate={
										step >= STEP_INTAKE ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }
									}
									transition={
										step >= STEP_INTAKE
											? { duration: 0.3, delay: arriveDelay, ease: "easeOut" }
											: { duration: 0 }
									}
								/>
								{/* 条目文字与亮点：晚色条一拍浮现 */}
								<motion.div
									className="absolute inset-y-0 left-2.5 flex items-center gap-1.5"
									initial={{ opacity: 0 }}
									animate={{ opacity: step >= STEP_INTAKE ? 1 : 0 }}
									transition={
										step >= STEP_INTAKE
											? { duration: 0.25, delay: arriveDelay + 0.2 }
											: { duration: 0 }
									}
								>
									<span
										className="size-1 rounded-full"
										style={{ backgroundColor: `rgb(${chip.core})` }}
									/>
									<span
										className="text-[9px] tracking-wider"
										style={{ color: `rgb(${chip.core})` }}
									>
										{chip.label}
									</span>
								</motion.div>
							</div>
						);
					})}
				</motion.div>

				{/* // @ 知识碎片：与「知识入库」同款——四角错峰起飞，走弧线收正倾角，落位瞬间缩小淡出 */}
				{CHIPS.map((chip, index) => (
					<motion.div
						key={`chip-${chip.kind}`}
						className="absolute flex size-9 items-center justify-center rounded-lg bg-white/5 backdrop-blur-sm"
						style={{
							left: px(CHIP_TARGET_X),
							top: py(chip.slotY),
							marginLeft: -18,
							marginTop: -18,
							border: `1px solid rgba(${chip.halo},0.4)`,
							boxShadow: `0 0 18px rgba(${chip.halo},0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
						}}
						initial={{ x: chip.fromX, y: chip.fromY, rotate: chip.tilt, opacity: 0, scale: 0.9 }}
						animate={
							step >= STEP_INTAKE
								? {
										x: [chip.fromX, chip.arcX, 0],
										y: [chip.fromY, chip.arcY, 0],
										rotate: [chip.tilt, chip.tilt * 0.35, 0],
										opacity: [0, 1, 0],
										scale: [0.9, 1.04, 0.82],
									}
								: { x: chip.fromX, y: chip.fromY, rotate: chip.tilt, opacity: 0, scale: 0.9 }
						}
						transition={
							step >= STEP_INTAKE
								? {
										duration: CHIP_FLIGHT,
										delay: index * CHIP_STAGGER,
										ease: "easeInOut",
										times: [0, 0.55, 1],
										opacity: {
											duration: CHIP_FLIGHT,
											delay: index * CHIP_STAGGER,
											times: [0, 0.25, 1],
										},
									}
								: { duration: 0 }
						}
					>
						<ChipIcon kind={chip.kind} core={chip.core} />
					</motion.div>
				))}

				{/* // @ 分发光流：与「知识入库」同款路线，从面板右缘出发，各路同色亮段依次滑向节点 */}
				<svg
					className="pointer-events-none absolute inset-0 h-full w-full"
					viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
					preserveAspectRatio="none"
					role="img"
					aria-label="知识库沿曲线光流把约束分发给三个智能体节点"
				>
					{ROUTES.map((route, index) => (
						<g key={`beam-${route.kind}`}>
							<motion.path
								d={route.d}
								fill="none"
								stroke="rgba(168,180,194,0.08)"
								strokeWidth={1}
								strokeDasharray="3 5"
								initial={{ opacity: 0 }}
								animate={{ opacity: step >= STEP_BEAMS ? 1 : 0 }}
								transition={{ duration: 0.25, ease: "easeOut" }}
							/>
							<motion.path
								d={route.d}
								fill="none"
								stroke={`rgb(${route.halo})`}
								strokeWidth={2.5}
								strokeLinecap="round"
								initial={{ pathLength: 0.22, pathOffset: 0, opacity: 0 }}
								animate={
									step >= STEP_BEAMS
										? { pathOffset: [0, 0.78], opacity: [0, 1, 1, 0] }
										: { pathOffset: 0, opacity: 0 }
								}
								transition={
									step >= STEP_BEAMS
										? {
												duration: 0.55,
												delay: index * BEAM_STAGGER,
												ease: "easeInOut",
												opacity: {
													duration: 0.55,
													delay: index * BEAM_STAGGER,
													times: [0, 0.15, 0.85, 1],
												},
											}
										: { duration: 0 }
								}
							/>
						</g>
					))}
				</svg>

				{/* // @ 三个智能体节点：与「知识入库」同位置同外壳的迷你玻璃方块，内为火花标识，命中点亮 */}
				{ROUTES.map((route, index) => (
					<div
						key={`node-${route.kind}`}
						className="absolute"
						style={{ left: px(route.nodeX), top: py(route.nodeY), marginLeft: -16, marginTop: -16 }}
					>
						{/* 命中脉冲环 */}
						<motion.span
							className="absolute inset-0 rounded-lg border"
							style={{ borderColor: `rgba(${route.halo},0.7)` }}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={
								step >= STEP_BEAMS
									? { opacity: [0, 0.7, 0], scale: [0.8, 1.6, 1.8] }
									: { opacity: 0, scale: 0.8 }
							}
							transition={
								step >= STEP_BEAMS
									? { duration: 0.6, delay: 0.35 + index * BEAM_STAGGER, ease: "easeOut" }
									: { duration: 0 }
							}
						/>
						<motion.div
							className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/5 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)] backdrop-blur-sm"
							initial={{ opacity: 0 }}
							animate={{ opacity: step >= STEP_LIBRARY ? 1 : 0 }}
							transition={{ duration: 0.5, delay: 0.3 + index * 0.15, ease: "easeOut" }}
						>
							<motion.svg
								className="size-3.5"
								viewBox="0 0 14 14"
								fill="currentColor"
								aria-hidden="true"
								initial={false}
								animate={{
									color: step >= STEP_WINDOWS ? `rgb(${route.core})` : "rgb(110,120,134)",
								}}
								transition={{ duration: 0.4 }}
							>
								<path d="M7 0c0.9 3.7 2.4 5.2 7 7-4.6 1.8-6.1 3.3-7 7-0.9-3.7-2.4-5.2-7-7 4.6-1.8 6.1-3.3 7-7Z" />
							</motion.svg>
						</motion.div>
					</div>
				))}

				{/* // @ 三扇终端弹窗：第二图层压在库上，逐个弹出右下错位层叠；交通灯标题栏、$ 提示符逐行输出、方块光标闪烁，收尾打勾 */}
				{ROUTES.map((route, routeIndex) => (
					<motion.div
						key={`window-${route.kind}`}
						className="absolute w-[64%] overflow-hidden rounded-lg border border-white/10 bg-[#0b0e13]/95 shadow-2xl shadow-black/70"
						style={{
							left: WINDOW_POSITIONS[routeIndex]?.left,
							top: WINDOW_POSITIONS[routeIndex]?.top,
							zIndex: 20 + routeIndex,
						}}
						initial={{ opacity: 0, y: 14, scale: 0.92 }}
						animate={
							step >= STEP_WINDOWS
								? { opacity: 1, y: 0, scale: 1 }
								: { opacity: 0, y: 14, scale: 0.92 }
						}
						transition={{
							duration: 0.32,
							delay: step >= STEP_WINDOWS ? routeIndex * WINDOW_STAGGER : 0,
							ease: "easeOut",
						}}
					>
						{/* 标题栏：mac 交通灯 + 等宽终端标题 + 生成状态 */}
						<div className="flex items-center gap-1.5 border-white/8 border-b bg-white/4 px-2.5 py-1.5">
							<span className="size-2 rounded-full bg-[#ff5f57]/90" />
							<span className="size-2 rounded-full bg-[#febc2e]/90" />
							<span className="size-2 rounded-full bg-[#28c840]/90" />
							<span className="ml-1.5 font-mono text-[9px] text-neutral-500">
								{route.title} — zsh
							</span>
							{/* 状态位：生成中脉动圆点 → ✓ */}
							<span className="relative ml-auto h-3 w-3">
								<motion.span
									className="absolute inset-0.5 rounded-full"
									style={{ backgroundColor: `rgb(${route.halo})` }}
									initial={{ opacity: 0.3 }}
									animate={step >= STEP_SEAL ? { opacity: 0 } : { opacity: [0.3, 1, 0.3] }}
									transition={
										step >= STEP_SEAL
											? { duration: 0.2 }
											: { duration: 1, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }
									}
								/>
								<motion.span
									className="absolute inset-0 flex items-center justify-center text-[8px]"
									style={{ color: `rgb(${route.core})` }}
									initial={{ opacity: 0, scale: 0.5 }}
									animate={
										step >= STEP_SEAL ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }
									}
									transition={{
										duration: 0.25,
										delay: step >= STEP_SEAL ? routeIndex * 0.12 : 0,
										ease: "easeOut",
									}}
								>
									✓
								</motion.span>
							</span>
						</div>
						{/* 终端正文：真实输出内容——$ 命令、同步结果、执行过程、耗时逐行打出，尾随闪烁方块光标 */}
						<div className="space-y-1.5 px-3 py-2.5 font-mono text-[9px] leading-none">
							{route.rows.map((row, rowIndex) => (
								<motion.div
									key={row.text}
									className="flex h-3 items-center gap-1"
									initial={{ opacity: 0, x: -4 }}
									animate={step >= STEP_STREAM ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
									transition={
										step >= STEP_STREAM
											? {
													duration: 0.22,
													delay: routeIndex * WINDOW_STAGGER + rowIndex * ROW_STAGGER,
													ease: "easeOut",
												}
											: { duration: 0 }
									}
								>
									{row.tone === "cmd" && <span style={{ color: `rgb(${route.core})` }}>$</span>}
									<span
										className={
											row.tone === "out"
												? "text-neutral-400"
												: row.tone === "dim"
													? "text-neutral-600"
													: "text-neutral-200"
										}
										style={row.tone === "ok" ? { color: `rgb(${route.core})` } : undefined}
									>
										{row.text}
									</span>
								</motion.div>
							))}
							{/* 方块光标：输出期间闪烁，打勾后熄灭 */}
							<div className="flex h-2 items-center">
								<motion.span
									className="h-2 w-1.5"
									style={{ backgroundColor: `rgba(${route.core},0.85)` }}
									initial={{ opacity: 0 }}
									animate={
										step >= STEP_STREAM && step < STEP_SEAL
											? { opacity: [1, 0, 1] }
											: { opacity: 0 }
									}
									transition={
										step >= STEP_STREAM && step < STEP_SEAL
											? { duration: 0.9, ease: "linear", repeat: Number.POSITIVE_INFINITY }
											: { duration: 0.2 }
									}
								/>
							</div>
						</div>
					</motion.div>
				))}
			</motion.div>

			{/* 底部文案：晚半拍上浮淡入，不参与循环 */}
			<motion.div
				className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-1.5 text-center"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
			>
				<p className="font-semibold text-neutral-200 text-xl">归纳所有 AI 知识</p>
				<p className="text-neutral-500 text-sm">沉淀一次，处处复用</p>
			</motion.div>
		</div>
	);
}

type ChipKind = "doc" | "chat" | "bolt" | "code";

type ChipIconProps = {
	kind: ChipKind;
	/** rgb 三元组，用作描边色 */
	core: string;
};

// 碎片内的简笔图标：文档（规约）/ 对话气泡（提示词）/ 闪电（技能）/ 代码括号（代码约定）——与「知识入库」一致
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
				</>
			)}
		</svg>
	);
}

// @ 数据：四枚知识碎片与三条分发路线（几何取值与「知识入库」完全一致）

type Chip = {
	readonly kind: ChipKind;
	readonly label: string;
	/** 槽位中心 y（画布坐标） */
	readonly slotY: number;
	readonly fromX: number;
	readonly fromY: number;
	/** 弧线中途偏移，制造弯曲飞行 */
	readonly arcX: number;
	readonly arcY: number;
	/** 起飞倾角（度），落位时收正 */
	readonly tilt: number;
	readonly core: string;
	readonly halo: string;
};

const CHIPS: readonly Chip[] = [
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
];

// 终端行的语气：cmd=$ 命令行（亮白）、ok=同色成功行、out=常规输出、dim=收尾弱化
type RowTone = "cmd" | "ok" | "out" | "dim";

type Route = {
	readonly kind: string;
	/** 终端标题栏里的会话名 */
	readonly title: string;
	readonly d: string;
	readonly nodeX: number;
	readonly nodeY: number;
	readonly core: string;
	readonly halo: string;
	/** 终端逐行打出的真实输出内容 */
	readonly rows: readonly { readonly text: string; readonly tone: RowTone }[];
};

const ROUTES: readonly Route[] = [
	{
		kind: "route-a",
		title: "agent-01",
		d: "M 296 202 C 340 206 332 280 356 322",
		nodeX: 356,
		nodeY: 322,
		core: "226,232,240",
		halo: "168,180,194",
		rows: [
			{ text: "ai-spec pull", tone: "cmd" },
			{ text: "✓ 已载入 4 条团队知识", tone: "ok" },
			{ text: "应用规约与代码约定…", tone: "out" },
			{ text: "生成 PR 描述 · 遵循规约", tone: "out" },
			{ text: "done · 0.8s", tone: "dim" },
		],
	},
	{
		kind: "route-b",
		title: "agent-02",
		d: "M 296 271 C 348 278 352 350 388 404",
		nodeX: 388,
		nodeY: 404,
		core: "203,212,252",
		halo: "134,146,216",
		rows: [
			{ text: "ai-spec apply --all", tone: "cmd" },
			{ text: "✓ 提示词已注入上下文", tone: "ok" },
			{ text: "按〈技能〉模板执行任务…", tone: "out" },
			{ text: "输出符合团队规约", tone: "out" },
			{ text: "done · 1.2s", tone: "dim" },
		],
	},
	{
		kind: "route-c",
		title: "agent-03",
		d: "M 296 340 C 342 352 320 432 352 482",
		nodeX: 352,
		nodeY: 482,
		core: "198,230,238",
		halo: "118,178,198",
		rows: [
			{ text: "ai-spec sync", tone: "cmd" },
			{ text: "✓ 知识库已同步", tone: "ok" },
			{ text: "校验代码约定…", tone: "out" },
			{ text: "全部通过 · 零违规", tone: "out" },
			{ text: "done · 0.6s", tone: "dim" },
		],
	},
];
