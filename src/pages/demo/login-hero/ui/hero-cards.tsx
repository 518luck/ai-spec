"use client";

// # 浮动卡片侧板：规约/提示词/技能三张玻璃卡按前中后三层深度漂浮，斜向高光轮流扫过，底部浮现品牌文案

import { motion } from "motion/react";
import type { JSX } from "react";

// @ 卡片编排：前景规约卡最大最清晰居中偏左，中景提示词卡右上收小，背景技能卡左下最淡
type HeroCard = {
	label: string;
	icon: "spec" | "prompt" | "skill";
	// 静态外观：定位、宽度、层级全走类名，基础倾角与透明度进动画常量
	className: string;
	opacity: number;
	tilt: number;
	entranceDelay: number;
	// 漂浮参数：y 幅度与摇曳角度首尾同值，无限循环无缝衔接
	float: { y: number; sway: number; duration: number; delay: number };
	// 高光扫过参数：三张卡靠 delay + repeatDelay 错开，永不同时扫
	sweep: { delay: number; repeatDelay: number };
	lines: readonly string[];
};

const CARDS: readonly HeroCard[] = [
	{
		label: "规约",
		icon: "spec",
		className: "top-[24%] left-[11%] z-30 w-56",
		opacity: 1,
		tilt: -1.5,
		entranceDelay: 0.45,
		float: { y: 6, sway: 1, duration: 6.4, delay: 0.2 },
		sweep: { delay: 1.6, repeatDelay: 4.2 },
		lines: ["w-11/12", "w-3/5", "w-4/5"],
	},
	{
		label: "提示词",
		icon: "prompt",
		className: "top-[12%] right-[8%] z-20 w-44",
		opacity: 0.8,
		tilt: 2.5,
		entranceDelay: 0.26,
		float: { y: 5, sway: 1, duration: 7.6, delay: 1.1 },
		sweep: { delay: 3.4, repeatDelay: 3.8 },
		lines: ["w-4/5", "w-1/2"],
	},
	{
		label: "技能",
		icon: "skill",
		className: "top-[42%] left-[7%] z-10 w-40",
		opacity: 0.55,
		tilt: -2,
		entranceDelay: 0.1,
		float: { y: 4, sway: 0.8, duration: 5.6, delay: 0.6 },
		sweep: { delay: 5, repeatDelay: 4.6 },
		lines: ["w-2/3", "w-5/6"],
	},
] as const;

export function HeroCards(): JSX.Element {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* // @ 背景光晕：两团静态冷色光斑错位铺底，给玻璃卡垫出纵深 */}
			<div className="absolute top-[-6%] left-[2%] h-[46%] w-[76%] rounded-full bg-[radial-gradient(closest-side,rgba(168,180,194,0.22),transparent_70%)] blur-3xl" />
			<div className="absolute top-[34%] right-[-16%] h-[42%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.18),transparent_72%)] blur-3xl" />

			{/* // @ 卡片层：外层管进场（错峰上浮淡入 + 基础倾角），内层管漂浮，卡面内嵌高光扫过条 */}
			{CARDS.map(
				({
					label,
					icon,
					className,
					opacity,
					tilt,
					entranceDelay,
					float: { y: floatY, sway, duration: floatDuration, delay: floatDelay },
					sweep: { delay: sweepDelay, repeatDelay: sweepRepeatDelay },
					lines,
				}) => (
					<motion.div
						key={label}
						className={`absolute ${className}`}
						initial={{ opacity: 0, y: 30, rotate: tilt }}
						animate={{ opacity, y: 0, rotate: tilt }}
						transition={{ duration: 0.8, ease: "easeOut", delay: entranceDelay }}
					>
						<motion.div
							animate={{ y: [0, -floatY, 0, floatY, 0], rotate: [0, sway, 0, -sway, 0] }}
							transition={{
								duration: floatDuration,
								ease: "easeInOut",
								repeat: Number.POSITIVE_INFINITY,
								delay: floatDelay,
							}}
						>
							{/* 玻璃卡面：overflow-hidden 兜住扫过的高光条不外溢 */}
							<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
								{/* 静态玻璃高光：左上到右下的微亮渐变叠底，压出卡面受光感 */}
								<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 to-transparent" />

								{/* 卡头：图标位 + 中文标签 */}
								<div className="flex items-center gap-2.5">
									<span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[rgb(168,180,194)]">
										<CardIcon kind={icon} />
									</span>
									<span className="text-neutral-300 text-sm">{label}</span>
								</div>

								{/* 内容占位线：不同宽度的灰条模拟条目 */}
								<div className="mt-4 flex flex-col gap-2.5">
									{lines.map((width) => (
										<div key={width} className={`h-2 rounded-full bg-white/10 ${width}`} />
									))}
								</div>

								{/* > 高光扫过条：斜 15° 的细长白色渐变，从卡外左侧划到卡外右侧后隐身等待下一轮 */}
								<motion.div
									className="pointer-events-none absolute inset-y-[-40%] left-0 w-14 bg-linear-to-r from-transparent via-white/20 to-transparent"
									initial={{ x: "-160%", rotate: 15, opacity: 0 }}
									animate={{ x: ["-160%", "520%"], rotate: 15, opacity: [0, 1, 1, 0] }}
									transition={{
										duration: 1.8,
										ease: "easeInOut",
										repeat: Number.POSITIVE_INFINITY,
										delay: sweepDelay,
										repeatDelay: sweepRepeatDelay,
									}}
								/>
							</div>
						</motion.div>
					</motion.div>
				),
			)}

			{/* // @ 品牌文案：比卡片稍晚上浮淡入 */}
			<motion.div
				className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-1.5 px-6 text-center"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, ease: "easeOut", delay: 0.75 }}
			>
				<p className="font-semibold text-neutral-200 text-xl">把团队规约，交给每一个 AI</p>
				<p className="text-neutral-500 text-sm">一次沉淀，处处生效</p>
			</motion.div>
		</div>
	);
}

type CardIconProps = {
	kind: HeroCard["icon"];
};

// 三个业务图标走内联 SVG：规约=带勾文档、提示词=对话气泡、技能=闪电，随父级 currentColor 描成亮银蓝
function CardIcon({ kind }: CardIconProps): JSX.Element {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-4"
		>
			{kind === "spec" && (
				<>
					<path d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
					<path d="M15 3v5h5" />
					<path d="m9 13.5 2 2 4-4.5" />
				</>
			)}
			{kind === "prompt" && (
				<>
					<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
					<path d="M8.5 10.5h7" />
					<path d="M8.5 13.5h4.5" />
				</>
			)}
			{kind === "skill" && <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />}
		</svg>
	);
}
