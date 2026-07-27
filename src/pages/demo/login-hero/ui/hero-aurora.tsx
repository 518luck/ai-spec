"use client";

// # 极光氛围侧板：巨大冷色光斑缓慢漂移交叠出极光层次，细网格与暗角托底，底部浮现品牌文案

import { motion } from "motion/react";
import type { JSX } from "react";

// @ 光斑编排：三主一辅，位置分散在左上/右中/左下，周期互不相同保证永不同步
type AuroraBlob = {
	// 静态外观：尺寸、定位、径向渐变颜色全部走 CSS 类
	className: string;
	// 漂移关键帧：首尾同值，无限循环时无缝衔接
	x: number[];
	y: number[];
	scale: number[];
	opacity: number[];
	duration: number;
};

const BLOBS: AuroraBlob[] = [
	{
		// 亮银蓝主光斑：左上，最亮的一层，定下整体冷色基调
		className:
			"-top-[10%] -left-[18%] h-[42%] w-[70%] bg-[radial-gradient(closest-side,rgba(168,180,194,0.34),rgba(168,180,194,0.10)_58%,transparent)]",
		x: [0, 34, -22, 0],
		y: [0, 20, -14, 0],
		scale: [1, 1.1, 0.96, 1],
		opacity: [0.85, 1, 0.7, 0.85],
		duration: 14,
	},
	{
		// 低饱和靛蓝光斑：右中，压暗调灰后与银蓝交叠出紫青过渡
		className:
			"top-[30%] -right-[20%] h-[40%] w-[66%] bg-[radial-gradient(closest-side,rgba(99,102,241,0.26),rgba(79,70,229,0.09)_60%,transparent)]",
		x: [0, -30, 18, 0],
		y: [0, 26, -18, 0],
		scale: [1, 0.94, 1.08, 1],
		opacity: [0.8, 0.6, 1, 0.8],
		duration: 17,
	},
	{
		// 冷青光斑：左下，透明度最低，只负责给底部文案后方铺一层微光
		className:
			"-left-[14%] bottom-[6%] h-[36%] w-[60%] bg-[radial-gradient(closest-side,rgba(56,189,248,0.18),rgba(45,212,191,0.06)_62%,transparent)]",
		x: [0, 24, -16, 0],
		y: [0, -22, 12, 0],
		scale: [1, 1.06, 0.95, 1],
		opacity: [0.7, 0.95, 0.55, 0.7],
		duration: 11,
	},
	{
		// 深靛辅助光斑：中上偏右，最暗的一层，只加厚交叠处的色彩层次
		className:
			"top-[6%] right-[2%] h-[30%] w-[46%] bg-[radial-gradient(closest-side,rgba(67,56,202,0.20),transparent_70%)]",
		x: [0, -18, 12, 0],
		y: [0, 16, -10, 0],
		scale: [1, 1.08, 0.94, 1],
		opacity: [0.75, 1, 0.6, 0.75],
		duration: 9,
	},
];

export function HeroAurora(): JSX.Element {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* // @ 极光层：整层一次性淡入进场，随后每个光斑各自无限漂移呼吸 */}
			<motion.div
				className="absolute inset-0"
				initial={{ opacity: 0, scale: 1.06 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 1.6, ease: "easeOut" }}
			>
				{BLOBS.map(({ className, x, y, scale, opacity, duration }) => (
					<motion.div
						key={className}
						className={`absolute rounded-full blur-3xl ${className}`}
						animate={{ x, y, scale, opacity }}
						transition={{ duration, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
					/>
				))}
			</motion.div>

			{/* 细网格纹理：极低透明度银蓝网格，中心可见四周淡出，给光晕加一点结构感 */}
			<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,180,194,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,180,194,0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_78%)]" />

			{/* 底部暗角：把文案区域从光晕里托出来，保证可读性 */}
			<div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgba(10,10,10,0.72),transparent)]" />

			{/* // @ 品牌文案：上浮淡入，比极光层稍晚出场 */}
			<motion.div
				className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-1.5 px-6 text-center"
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
			>
				<p className="font-semibold text-neutral-200 text-xl">把团队规约，交给每一个 AI</p>
				<p className="text-neutral-500 text-sm">一次沉淀，处处生效</p>
			</motion.div>
		</div>
	);
}
