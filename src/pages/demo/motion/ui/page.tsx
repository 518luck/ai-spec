"use client";

// # 动效演示页：把空白页常用的几类动效摆成独立格子，每格可单独重播，方便挑选后再搬进业务组件

import { motion } from "motion/react";
import type { JSX } from "react";

import { ENTER_TRANSITION, staggerDelay } from "../lib/presets";
import { DemoAurora } from "./demo-aurora";
import { DemoCounter } from "./demo-counter";
import { DemoDraw } from "./demo-draw";
import { DemoMagnetic } from "./demo-magnetic";
import { DemoMorph } from "./demo-morph";
import { DemoSkeleton } from "./demo-skeleton";
import { DemoStagger } from "./demo-stagger";
import { DemoTextReveal } from "./demo-text-reveal";
import { Stage } from "./stage";

type DemoEntry = {
	title: string;
	description: string;
	Content: () => JSX.Element;
};

// @ 演示清单：按「进场 → 环境 → 交互」的顺序排，越靠前越适合直接铺在空白首屏
const DEMOS: DemoEntry[] = [
	{ title: "错峰浮现", description: "列表逐项上浮，首屏内容依次铺开", Content: DemoStagger },
	{ title: "逐词升起", description: "标题按词从遮罩下沿推上来", Content: DemoTextReveal },
	{ title: "描边绘制", description: "空状态插画沿路径一笔画出", Content: DemoDraw },
	{ title: "骨架交叉", description: "加载完成时骨架与内容错开半拍交替", Content: DemoSkeleton },
	{ title: "数字滚动", description: "统计值缓动到目标，进度条同时到位", Content: DemoCounter },
	{ title: "极光背景", description: "模糊色块持续漂移，铺在首屏背后", Content: DemoAurora },
	{ title: "磁吸按钮", description: "按钮朝指针偏移，离开时弹回", Content: DemoMagnetic },
	{ title: "共享形变", description: "卡片与面板共用 layoutId，点开像长大", Content: DemoMorph },
];

export function MotionDemoPage(): JSX.Element {
	return (
		<main className="mx-auto w-full max-w-6xl px-6 py-12">
			<motion.header
				className="mb-8 flex flex-col gap-1.5"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={ENTER_TRANSITION}
			>
				<h1 className="font-semibold text-2xl tracking-tight">动效演示</h1>
				<p className="text-muted-foreground text-sm">
					八种空白页常用动效，全部基于 motion；点每格右上角「重播」重看一遍。
				</p>
			</motion.header>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{DEMOS.map(({ title, description, Content }, index) => (
					<motion.div
						key={title}
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ ...ENTER_TRANSITION, delay: staggerDelay(index) }}
					>
						<Stage title={title} description={description}>
							<Content />
						</Stage>
					</motion.div>
				))}
			</div>
		</main>
	);
}
