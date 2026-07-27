"use client";

// # 灯塔徽标：中央发光的规约文档徽标荡开同心涟漪，卫星沿虚线轨道绕行，底部落文案

import { motion } from "motion/react";
import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";

// @ 冷色系配置：锚定亮银蓝 #a8b4c2，辅以低饱和靛蓝与冷青
type RippleRing = {
	className: string;
	delay: number;
};

// 三圈涟漪错相 2.8s，稳定后每 2.8s 从徽标背后荡开一圈
const RIPPLE_RINGS: RippleRing[] = [
	{ className: "border-[#a8b4c2]/25", delay: 1.4 },
	{ className: "border-[#7f8ad4]/20", delay: 4.2 },
	{ className: "border-[#8fb6c8]/20", delay: 7 },
];

type OrbitRing = {
	className: string;
	delay: number;
};

// 两条极低透明度的虚线轨道，进场时错峰淡入
const ORBIT_RINGS: OrbitRing[] = [
	{ className: "size-55", delay: 0.7 },
	{ className: "size-75", delay: 0.85 },
];

type GlyphLine = {
	x2: number;
	y: number;
	stroke: string;
	delay: number;
};

// 文档图形里的三条正文线，颜色自上而下从银蓝过渡到靛蓝
const GLYPH_LINES: GlyphLine[] = [
	{ x2: 33, y: 21, stroke: "#c9d4e0", delay: 0.75 },
	{ x2: 33, y: 27, stroke: "#adbacb", delay: 0.9 },
	{ x2: 29, y: 33, stroke: "#8f9ae0", delay: 1.05 },
];

export function HeroBeacon(): JSX.Element {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* 所有同心图层叠进同一个网格单元，天然对齐圆心，动画只动 transform 不打架 */}
			<div className="absolute top-[42%] left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center">
				{/* 三层静态 blur 光晕由外到内收拢，进场时依次亮起 */}
				<motion.div
					className="col-start-1 row-start-1 size-80 rounded-full bg-[#5f6da6]/15 blur-3xl"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1.4, ease: "easeOut", delay: 0.1 }}
				/>
				<motion.div
					className="col-start-1 row-start-1 size-56 rounded-full bg-[#a8b4c2]/15 blur-3xl"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1.4, ease: "easeOut", delay: 0.25 }}
				/>
				<motion.div
					className="col-start-1 row-start-1 size-32 rounded-full bg-[#cfd9e4]/20 blur-2xl"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
				/>

				{/* 涟漪：先快后慢地扩散，透明度冲高后长尾消散，接近水面荡开的节奏 */}
				{RIPPLE_RINGS.map(({ className, delay }) => (
					<motion.div
						key={className}
						className={cn("col-start-1 row-start-1 size-36 rounded-full border", className)}
						initial={{ opacity: 0, scale: 0.55 }}
						animate={{ opacity: [0, 0.35, 0], scale: [0.55, 1.2, 2.05] }}
						transition={{
							duration: 8.4,
							times: [0, 0.22, 1],
							ease: "easeOut",
							repeat: Number.POSITIVE_INFINITY,
							delay,
						}}
					/>
				))}

				{/* 虚线轨道 */}
				{ORBIT_RINGS.map(({ className, delay }) => (
					<motion.div
						key={className}
						className={cn(
							"col-start-1 row-start-1 rounded-full border border-[#a8b4c2]/12 border-dashed",
							className,
						)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.9, ease: "easeOut", delay }}
					/>
				))}

				{/* > 卫星绕行用旋转包装层：包装层整体匀速旋转，圆点钉在其边缘中点，自然走出圆轨 */}
				<motion.div
					className="col-start-1 row-start-1 size-75"
					initial={{ rotate: 140 }}
					animate={{ rotate: 500 }}
					transition={{ duration: 16, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
				>
					<motion.div
						className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dbe3ec] shadow-[0_0_12px_3px_rgba(207,217,228,0.5)]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.8, ease: "easeOut", delay: 0.95 }}
					/>
					<motion.div
						className="absolute top-full left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9fc6d8] shadow-[0_0_10px_2px_rgba(127,180,201,0.45)]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.8, ease: "easeOut", delay: 1.1 }}
					/>
				</motion.div>
				{/* 内圈卫星反向绕行，周期与外圈错开避免同步 */}
				<motion.div
					className="col-start-1 row-start-1 size-55"
					initial={{ rotate: 260 }}
					animate={{ rotate: -100 }}
					transition={{ duration: 10, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
				>
					<motion.div
						className="absolute top-0 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9aa4e8] shadow-[0_0_10px_2px_rgba(127,138,212,0.5)]"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.8, ease: "easeOut", delay: 1.25 }}
					/>
				</motion.div>

				{/* 徽标：外层 spring 弹入一次，内层接管 4s 呼吸与 ±3px 浮动 */}
				<motion.div
					className="col-start-1 row-start-1"
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{
						type: "spring",
						stiffness: 190,
						damping: 18,
						delay: 0.2,
						opacity: { duration: 0.5, ease: "easeOut", delay: 0.2 },
					}}
				>
					<motion.div
						animate={{ scale: [1, 1.03, 1], y: [0, -3, 0, 3, 0] }}
						transition={{
							duration: 4.2,
							ease: "easeInOut",
							repeat: Number.POSITIVE_INFINITY,
							delay: 1.3,
						}}
					>
						{/* 玻璃底座：半透明白边框 + 微白底，外圈冷光阴影让它真正“发光” */}
						<div className="relative grid size-28 place-items-center rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_44px_-8px_rgba(168,180,194,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
							{/* 顶部高光，模拟玻璃的受光面 */}
							<div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-3xl bg-gradient-to-b from-white/8 to-transparent" />

							<svg
								className="size-14"
								viewBox="0 0 56 56"
								fill="none"
								role="img"
								aria-label="发光的规约文档徽标"
							>
								<defs>
									<linearGradient id="hero-beacon-stroke" x1="0" y1="0" x2="1" y2="1">
										<stop offset="0" stopColor="#d6dfe9" />
										<stop offset="1" stopColor="#7f8ad4" />
									</linearGradient>
								</defs>
								{/* 文档轮廓先描边画出，再由三条正文线依次落笔 */}
								<motion.rect
									x="17.5"
									y="11.5"
									width="21"
									height="33"
									rx="4"
									stroke="url(#hero-beacon-stroke)"
									strokeWidth="1.6"
									fill="rgba(255,255,255,0.04)"
									initial={{ pathLength: 0, opacity: 0 }}
									animate={{ pathLength: 1, opacity: 1 }}
									transition={{
										duration: 0.9,
										ease: "easeOut",
										delay: 0.45,
										opacity: { duration: 0.3, ease: "easeOut", delay: 0.45 },
									}}
								/>
								{GLYPH_LINES.map(({ x2, y, stroke, delay }) => (
									<motion.line
										key={y}
										x1="23"
										y1={y}
										x2={x2}
										y2={y}
										stroke={stroke}
										strokeWidth="1.6"
										strokeLinecap="round"
										initial={{ pathLength: 0, opacity: 0 }}
										animate={{ pathLength: 1, opacity: 1 }}
										transition={{ duration: 0.45, ease: "easeOut", delay }}
									/>
								))}
							</svg>
						</div>
					</motion.div>
				</motion.div>
			</div>

			{/* 底部文案：徽标立稳后上浮淡入 */}
			<motion.div
				className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-2 text-center"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, ease: "easeOut", delay: 0.9 }}
			>
				<p className="font-semibold text-neutral-200 text-xl">把团队规约，交给每一个 AI</p>
				<p className="text-neutral-500 text-sm">一次沉淀，处处生效</p>
			</motion.div>
		</div>
	);
}
