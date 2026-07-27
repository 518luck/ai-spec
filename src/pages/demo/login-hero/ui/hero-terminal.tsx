"use client";

// # 登录侧板候选：AI 疾书 —— 步进状态机驱动的流式输出：提问 → 思考 → 两行文字 → 代码块 → 配图显影 → 收尾打勾
// > 时序靠 step 计数器逐步推进：上一步计时不结束，下一步的元素不会开始动画，顺序错乱在结构上不可能

import { motion } from "motion/react";
import { type JSX, useEffect, useState } from "react";

// @ 演出序列：每步的停留时长（秒），走完一轮后整个内容区重挂载重来
const SEQUENCE = [
	{ key: "start", hold: 0.3 },
	{ key: "bubble", hold: 0.4 },
	{ key: "think", hold: 0.7 },
	{ key: "lineA1", hold: 0.6 },
	{ key: "lineA2", hold: 0.9 },
	{ key: "codeFrame", hold: 0.35 },
	{ key: "code1", hold: 0.4 },
	{ key: "code2", hold: 0.4 },
	{ key: "code3", hold: 0.65 },
	{ key: "think2", hold: 0.7 },
	{ key: "imageFrame", hold: 0.3 },
	{ key: "scan", hold: 1.1 },
	{ key: "spark", hold: 0.35 },
	{ key: "lineB", hold: 0.8 },
	{ key: "done", hold: 2 },
	{ key: "fade", hold: 1.1 },
] as const;

type SequenceKey = (typeof SEQUENCE)[number]["key"];

// 按名字取步骤序号，元素声明"轮到我是第几步"时不用数下标
const stepIndexOf = (key: SequenceKey): number => SEQUENCE.findIndex((s) => s.key === key);

const STEP_BUBBLE = stepIndexOf("bubble");
const STEP_THINK = stepIndexOf("think");
const STEP_LINE_A1 = stepIndexOf("lineA1");
const STEP_LINE_A2 = stepIndexOf("lineA2");
const STEP_CODE_FRAME = stepIndexOf("codeFrame");
const STEP_CODE_1 = stepIndexOf("code1");
const STEP_CODE_2 = stepIndexOf("code2");
const STEP_CODE_3 = stepIndexOf("code3");
const STEP_THINK_2 = stepIndexOf("think2");
const STEP_IMAGE_FRAME = stepIndexOf("imageFrame");
const STEP_SCAN = stepIndexOf("scan");
const STEP_SPARK = stepIndexOf("spark");
const STEP_LINE_B = stepIndexOf("lineB");
const STEP_DONE = stepIndexOf("done");
const STEP_FADE = stepIndexOf("fade");

// 文字/代码的单行书写时长（秒）与扫描时长
const TEXT_WRITE = 0.45;
const CODE_WRITE = 0.3;
const SCAN_SWEEP = 1;
const SCAN_TRAVEL = 92;
const CHIP_GAP = 6;

type StepLoop = { step: number; runId: number };

// 步进循环：当前步计时结束才推进下一步；走完整轮重置 step 并换 runId，内容区借 key 重挂载重演
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

export function HeroTerminal(): JSX.Element {
	const { step, runId } = useStepLoop();

	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* 背景光晕：两团静态冷色辉光错位铺垫氛围 */}
			<div className="absolute top-[14%] -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
			<div className="absolute -right-16 bottom-[20%] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

			{/* 进场：卡片整体上浮淡入，仅一次 */}
			<div className="absolute inset-0 flex items-center justify-center pb-20">
				<motion.div
					className="w-[80%]"
					initial={{ opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, ease: "easeOut" }}
				>
					{/* 常驻缓浮：与步进循环独立的氛围小节奏 */}
					<motion.div
						animate={{ y: [0, -4, 0, 4, 0] }}
						transition={{ duration: 6, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
					>
						<div className="rounded-xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur-md">
							{/* 标题栏：AI 头像与名字在左，生成状态徽章在右 */}
							<div className="relative flex items-center gap-2 border-white/10 border-b px-4 py-2.5">
								<span className="relative flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/5">
									{/* 生成期的头像辉光：答完熄灭 */}
									<motion.span
										className="absolute inset-0 rounded-lg bg-[rgb(168,180,194)]/25 blur-[6px]"
										animate={{ opacity: step < STEP_DONE ? 1 : 0 }}
										transition={{ duration: 0.4, ease: "easeOut" }}
									/>
									<motion.svg
										className="relative h-3.5 w-3.5 text-[rgb(168,180,194)]"
										viewBox="0 0 14 14"
										fill="currentColor"
										aria-hidden="true"
										animate={{ scale: [1, 1.18, 1] }}
										transition={{
											duration: 2.2,
											ease: "easeInOut",
											repeat: Number.POSITIVE_INFINITY,
										}}
										style={{ transformBox: "fill-box", transformOrigin: "center" }}
									>
										<path d="M7 0c0.9 3.7 2.4 5.2 7 7-4.6 1.8-6.1 3.3-7 7-0.9-3.7-2.4-5.2-7-7 4.6-1.8 6.1-3.3 7-7Z" />
									</motion.svg>
								</span>
								<span className="font-medium text-[11px] text-neutral-300 tracking-wide">
									AI Spec
								</span>

								{/* 状态徽章两态叠放：生成中（带脉动圆点）→ ✓ 已生成 */}
								<span className="relative ml-auto h-5 w-16">
									<motion.span
										className="absolute inset-0 flex items-center justify-center gap-1 rounded-full border border-white/10 bg-white/5 text-[9px] text-neutral-400"
										animate={{ opacity: step < STEP_DONE ? 1 : 0 }}
										transition={{ duration: 0.25, ease: "easeOut" }}
									>
										<motion.span
											className="h-1 w-1 rounded-full bg-[rgb(168,180,194)]"
											animate={{ opacity: [0.3, 1, 0.3] }}
											transition={{
												duration: 1,
												ease: "easeInOut",
												repeat: Number.POSITIVE_INFINITY,
											}}
										/>
										生成中
									</motion.span>
									<motion.span
										className="absolute inset-0 flex items-center justify-center gap-1 rounded-full border border-[rgb(168,180,194)]/40 bg-[rgb(168,180,194)]/15 text-[9px] text-[rgb(168,180,194)]"
										initial={{ opacity: 0, scale: 0.7 }}
										animate={
											step >= STEP_DONE && step < STEP_FADE
												? { opacity: 1, scale: 1 }
												: { opacity: 0, scale: 0.7 }
										}
										transition={{ duration: 0.3, ease: "easeOut" }}
									>
										✓ 已生成
									</motion.span>
								</span>
							</div>

							{/* // > 内容区：key 绑 runId，每轮循环整体重挂载，从干净的隐藏态重新演一遍 */}
							<motion.div
								key={runId}
								className="px-5 py-4"
								animate={{ opacity: step >= STEP_FADE ? 0 : 1 }}
								transition={{ duration: 0.45, ease: "easeOut" }}
							>
								{/* 用户提问气泡：右对齐落下 */}
								<motion.div
									className="mb-4 flex justify-end"
									initial={{ opacity: 0, y: -8 }}
									animate={step >= STEP_BUBBLE ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
									transition={{ duration: 0.35, ease: "easeOut" }}
								>
									<span className="flex h-6 items-center rounded-lg rounded-tr-sm border border-white/10 bg-white/10 px-2.5">
										<span className="h-2 w-20 rounded-full bg-slate-300/40" />
									</span>
								</motion.div>

								<div className="space-y-3">
									{/* 开头文字段：两行依次疾书，思考点只在等待期出现 */}
									<div className="relative flex h-2.5 items-center">
										<ThinkDots active={step === STEP_THINK} />
										<StreamRow
											chips={LINE_A1}
											active={step >= STEP_LINE_A1}
											writing={step === STEP_LINE_A1}
											write={TEXT_WRITE}
										/>
									</div>
									<div className="relative flex h-2.5 items-center">
										<StreamRow
											chips={LINE_A2}
											active={step >= STEP_LINE_A2}
											writing={step === STEP_LINE_A2}
											write={TEXT_WRITE}
										/>
									</div>

									{/* 代码块：整段文字落定后外框才登场，三行代码逐行涌出 */}
									<motion.div
										className="rounded-lg border border-white/10 bg-black/40"
										initial={{ opacity: 0, y: 8 }}
										animate={step >= STEP_CODE_FRAME ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
										transition={{ duration: 0.35, ease: "easeOut" }}
									>
										<div className="flex items-center justify-between border-white/5 border-b px-3 py-1.5">
											<span className="font-medium text-[9px] text-neutral-500 tracking-wide">
												agents.config.ts
											</span>
											<span className="rounded bg-white/5 px-1 py-px text-[8px] text-neutral-500">
												TS
											</span>
										</div>
										<div className="space-y-1.5 px-3 py-2.5">
											{CODE_ROWS.map((row, index) => {
												const rowStep = CODE_STEPS[index] ?? STEP_CODE_1;
												return (
													<div
														key={row.id}
														className={`relative flex h-2 items-center ${row.indent ? "pl-3" : ""}`}
													>
														<StreamRow
															chips={row.chips}
															active={step >= rowStep}
															writing={step === rowStep}
															write={CODE_WRITE}
															height="h-2"
															caretHeight="h-3"
														/>
													</div>
												);
											})}
										</div>
									</motion.div>

									{/* 配图：思考点等待后外框登场，扫描线自上而下掠过、图片随之显影，完成火花一闪 */}
									<div className="relative">
										<ThinkDots active={step === STEP_THINK_2} className="top-1 left-0" />
										<motion.div
											className="relative h-24 w-3/5 overflow-hidden rounded-lg border border-white/10"
											initial={{ opacity: 0, y: 8 }}
											animate={
												step >= STEP_IMAGE_FRAME ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }
											}
											transition={{ duration: 0.35, ease: "easeOut" }}
										>
											<motion.div
												className="absolute inset-0 bg-linear-to-br from-indigo-400/35 via-cyan-300/20 to-violet-400/30"
												initial={{ opacity: 0 }}
												animate={{ opacity: step >= STEP_SCAN ? 1 : 0 }}
												transition={{ duration: SCAN_SWEEP, ease: "easeInOut" }}
											>
												<svg
													className="absolute inset-0 h-full w-full text-slate-200/50"
													viewBox="0 0 120 60"
													fill="none"
													stroke="currentColor"
													strokeWidth={2}
													strokeLinecap="round"
													strokeLinejoin="round"
													aria-hidden="true"
												>
													<circle cx={92} cy={16} r={6} />
													<path d="M10 52 34 24l16 18 10-11 24 21" />
												</svg>
											</motion.div>
											{/* 扫描线：仅在扫描步内一次性掠过 */}
											{step === STEP_SCAN && (
												<motion.span
													className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-[rgb(198,214,228)] shadow-[0_0_10px_rgba(168,180,194,0.9)]"
													initial={{ y: 0, opacity: 0 }}
													animate={{ y: [0, SCAN_TRAVEL], opacity: [0, 1, 1, 0] }}
													transition={{
														duration: SCAN_SWEEP,
														ease: "linear",
														times: [0, 0.08, 0.9, 1],
													}}
												/>
											)}
											<motion.svg
												className="absolute top-1.5 right-1.5 h-3 w-3 text-[rgb(208,222,234)]"
												viewBox="0 0 14 14"
												fill="currentColor"
												aria-hidden="true"
												initial={{ opacity: 0, scale: 0.4 }}
												animate={
													step >= STEP_SPARK ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }
												}
												transition={{ duration: 0.3, ease: "easeOut" }}
											>
												<path d="M7 0c0.9 3.7 2.4 5.2 7 7-4.6 1.8-6.1 3.3-7 7-0.9-3.7-2.4-5.2-7-7 4.6-1.8 6.1-3.3 7-7Z" />
											</motion.svg>
										</motion.div>
									</div>

									{/* 收尾行：写完后光标原地眨眼直到淡出 */}
									<div className="relative flex h-2.5 items-center">
										<StreamRow
											chips={LINE_B}
											active={step >= STEP_LINE_B}
											writing={step === STEP_LINE_B}
											write={TEXT_WRITE}
										/>
										{step >= STEP_DONE && step < STEP_FADE && (
											<motion.span
												className="absolute top-0 h-3.5 w-0.5 rounded-full bg-[rgb(168,180,194)] shadow-[0_0_8px_rgba(168,180,194,0.8)]"
												style={{ left: rowWidthOf(LINE_B_CHIPS) + 3 }}
												animate={{ opacity: [1, 0, 1] }}
												transition={{
													duration: 0.8,
													ease: "linear",
													repeat: Number.POSITIVE_INFINITY,
												}}
											/>
										)}
									</div>
								</div>
							</motion.div>
						</div>
					</motion.div>
				</motion.div>
			</div>

			{/* 底部文案：晚半拍上浮淡入 */}
			<motion.div
				className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-1.5 text-center"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, ease: "easeOut", delay: 0.25 }}
			>
				<p className="font-semibold text-neutral-200 text-xl">归纳所有 AI 知识</p>
				<p className="text-neutral-500 text-sm">沉淀一次，处处复用</p>
			</motion.div>
		</div>
	);
}

type ThinkDotsProps = {
	active: boolean;
	className?: string;
};

// 思考点：仅在等待步出现，三颗圆点错相位起伏
function ThinkDots({ active, className = "left-0" }: ThinkDotsProps): JSX.Element {
	return (
		<motion.span
			className={`absolute flex gap-1 ${className}`}
			initial={{ opacity: 0 }}
			animate={{ opacity: active ? 1 : 0 }}
			transition={{ duration: 0.2, ease: "easeOut" }}
		>
			{[0, 1, 2].map((dot) => (
				<motion.span
					key={dot}
					className="h-1.5 w-1.5 rounded-full bg-slate-300/60"
					animate={{ y: [0, -3, 0], opacity: [0.35, 1, 0.35] }}
					transition={{
						duration: 0.9,
						ease: "easeInOut",
						repeat: Number.POSITIVE_INFINITY,
						delay: dot * 0.15,
					}}
				/>
			))}
		</motion.span>
	);
}

type StreamRowProps = {
	chips: readonly ScheduledChip[];
	/** 是否已轮到本行（含已写完） */
	active: boolean;
	/** 是否正处于本行的书写步（决定光标显隐） */
	writing: boolean;
	/** 整行书写时长（秒） */
	write: number;
	height?: string;
	caretHeight?: string;
};

// > 流式行：轮到本行时各色条按宽度占比错峰展开，光标同步匀速划到行尾；未轮到时整行隐藏
function StreamRow({
	chips,
	active,
	writing,
	write,
	height = "h-2.5",
	caretHeight = "h-3.5",
}: StreamRowProps): JSX.Element {
	const rowWidth = rowWidthOf(chips);
	return (
		<>
			<span className="flex items-center gap-1.5">
				{chips.map((chip) => (
					<motion.span
						key={`${chip.delay}-${chip.width}`}
						className={`origin-left rounded-full ${height} ${chip.tone}`}
						style={{ width: chip.width }}
						initial={{ scaleX: 0 }}
						animate={{ scaleX: active ? 1 : 0 }}
						transition={
							active
								? { duration: chip.duration, delay: chip.delay, ease: "easeOut" }
								: { duration: 0 }
						}
					/>
				))}
			</span>
			{writing && (
				<motion.span
					className={`absolute top-0 left-0 w-0.5 rounded-full bg-[rgb(168,180,194)] shadow-[0_0_8px_rgba(168,180,194,0.8)] ${caretHeight}`}
					initial={{ x: 0, opacity: 1 }}
					animate={{ x: rowWidth }}
					transition={{ duration: write, ease: "linear" }}
				/>
			)}
		</>
	);
}

type ChipSpec = { readonly width: number; readonly tone: string };
type ScheduledChip = ChipSpec & { readonly delay: number; readonly duration: number };

// 一行色条总宽（含间隙），用于光标行尾定位
const rowWidthOf = (chips: readonly ChipSpec[]): number =>
	chips.reduce((sum, chip) => sum + chip.width, 0) + (chips.length - 1) * CHIP_GAP;

type ScheduleRowOptions = {
	chips: readonly ChipSpec[];
	write: number;
};

// 给一行色条按宽度占比切出各自的起始延迟与展开时长，宽条写得久，与匀速光标推进一致
const scheduleRow = ({ chips, write }: ScheduleRowOptions): ScheduledChip[] => {
	const totalWidth = chips.reduce((sum, chip) => sum + chip.width, 0);
	let prefix = 0;
	return chips.map((chip) => {
		const delay = (prefix / totalWidth) * write;
		prefix += chip.width;
		const duration = (chip.width / totalWidth) * write;
		return { ...chip, delay, duration };
	});
};

// @ 内容数据：开头文字段两行、三行代码、收尾小结；正文中性色为主，代码块语法色，收尾亮银蓝
const LINE_A1_CHIPS: readonly ChipSpec[] = [
	{ width: 46, tone: "bg-slate-300/45" },
	{ width: 84, tone: "bg-slate-300/35" },
	{ width: 34, tone: "bg-indigo-300/55" },
];

const LINE_A2_CHIPS: readonly ChipSpec[] = [
	{ width: 72, tone: "bg-slate-300/35" },
	{ width: 50, tone: "bg-slate-300/45" },
	{ width: 28, tone: "bg-cyan-300/50" },
];

const LINE_B_CHIPS: readonly ChipSpec[] = [
	{ width: 40, tone: "bg-[rgb(168,180,194)]/85" },
	{ width: 92, tone: "bg-slate-300/35" },
];

const CODE_ROW_SPECS = [
	{
		id: "code-1",
		indent: false,
		chips: [
			{ width: 28, tone: "bg-violet-300/55" },
			{ width: 60, tone: "bg-slate-300/30" },
			{ width: 24, tone: "bg-cyan-300/50" },
		],
	},
	{
		id: "code-2",
		indent: true,
		chips: [
			{ width: 36, tone: "bg-cyan-300/50" },
			{ width: 48, tone: "bg-slate-300/30" },
			{ width: 30, tone: "bg-indigo-300/55" },
		],
	},
	{
		id: "code-3",
		indent: true,
		chips: [
			{ width: 22, tone: "bg-indigo-300/55" },
			{ width: 70, tone: "bg-slate-300/30" },
		],
	},
] as const;

const LINE_A1 = scheduleRow({ chips: LINE_A1_CHIPS, write: TEXT_WRITE });
const LINE_A2 = scheduleRow({ chips: LINE_A2_CHIPS, write: TEXT_WRITE });
const LINE_B = scheduleRow({ chips: LINE_B_CHIPS, write: TEXT_WRITE });
const CODE_ROWS = CODE_ROW_SPECS.map((row) => ({
	id: row.id,
	indent: row.indent,
	chips: scheduleRow({ chips: row.chips, write: CODE_WRITE }),
}));
const CODE_STEPS: readonly number[] = [STEP_CODE_1, STEP_CODE_2, STEP_CODE_3];
