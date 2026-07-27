"use client";

// # 空状态动画演示页：六个"插画本体会动"的空状态，每个都是进场编排 + 无限 idle 循环，可整块搬进业务组件

import { motion } from "motion/react";
import type { JSX } from "react";

import { Icons } from "@/shared/ui/icons";

import { ENTER_TRANSITION, staggerDelay } from "../lib/presets";
import { EmptyChart } from "./empty-chart";
import { EmptyFolder } from "./empty-folder";
import { EmptyInbox } from "./empty-inbox";
import { EmptyOrbit } from "./empty-orbit";
import { EmptySearch } from "./empty-search";
import { EmptyWriting } from "./empty-writing";
import { Stage } from "./stage";

type DemoEntry = {
	title: string;
	description: string;
	Content: () => JSX.Element;
};

// @ 演示清单：按「归档 → 检索 → 创作 → 收件 → 数据 → 通用」的场景顺序排
const DEMOS: DemoEntry[] = [
	{
		title: "飘落归档",
		description: "图标卡片飘进挂着页面标识的文件夹",
		Content: EmptyFolderWithPageIcon,
	},
	{ title: "扫描搜寻", description: "放大镜来回扫过虚影文档，最后冒出问号", Content: EmptySearch },
	{ title: "逐行书写", description: "笔尖沿着文档一行行写出内容再重来", Content: EmptyWriting },
	{ title: "纸飞机入箱", description: "纸飞机滑一道弧线落进收件托盘", Content: EmptyInbox },
	{ title: "呼吸柱图", description: "幽灵柱起伏呼吸，虚线均线轻轻漂浮", Content: EmptyChart },
	{ title: "轨道星球", description: "卫星绕行、星光闪烁的通用空白宇宙", Content: EmptyOrbit },
];

export function EmptyStatesDemoPage(): JSX.Element {
	return (
		<main className="mx-auto w-full max-w-6xl px-6 py-12">
			<motion.header
				className="mb-8 flex flex-col gap-1.5"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={ENTER_TRANSITION}
			>
				<h1 className="font-semibold text-2xl tracking-tight">空状态动画</h1>
				<p className="text-muted-foreground text-sm">
					六种带 idle 循环的空状态插画，全部基于 motion 与主题色；点每格右上角「重播」重看进场。
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

// 演示 icon prop 的用法：给文件夹前盖挂「提示词」页的标识图标，各页面换成自己的 Icons 即可
function EmptyFolderWithPageIcon(): JSX.Element {
	return <EmptyFolder icon={<Icons.prompt />} />;
}
