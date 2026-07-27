"use client";

// # 登录侧板品牌动画演示页：五个候选方向按登录右栏比例并排，挑中哪个再搬进 auth-side-panel

import { motion } from "motion/react";
import type { JSX } from "react";

import { HeroAurora } from "./hero-aurora";
import { HeroBeacon } from "./hero-beacon";
import { HeroCards } from "./hero-cards";
import { HeroConstellation } from "./hero-constellation";
import { HeroFlow } from "./hero-flow";
import { HeroIntake } from "./hero-intake";
import { HeroNebula } from "./hero-nebula";
import { HeroPipeline } from "./hero-pipeline";
import { HeroTerminal } from "./hero-terminal";
import { Stage } from "./stage";

type DemoEntry = {
	title: string;
	description: string;
	Content: () => JSX.Element;
};

// @ 候选清单：第二轮「归纳 + 复用」叙事系列在前，第一轮氛围系列在后
const DEMOS: DemoEntry[] = [
	{
		title: "归纳复用全流程",
		description: "碎片入库 → 分发给三个智能体 → 各自弹窗疾书产出",
		Content: HeroPipeline,
	},
	{
		title: "知识入库",
		description: "四种知识碎片飞入玻璃库归位，条目反复向外分发",
		Content: HeroIntake,
	},
	{
		title: "汇流分发",
		description: "多源细流汇入棱镜归并，分成多路持续流出",
		Content: HeroFlow,
	},
	{
		title: "聚核辐射",
		description: "光屑螺旋聚成发光核心，一次次向卫星辐射",
		Content: HeroNebula,
	},
	{ title: "极光氛围", description: "大面积冷色光晕缓慢漂移，纯氛围不抢戏", Content: HeroAurora },
	{
		title: "星座网络",
		description: "星点连线构成规约网络，视差漂移与脉冲传导",
		Content: HeroConstellation,
	},
	{
		title: "灯塔徽标",
		description: "中央发光徽标荡开涟漪，卫星绕行，焦点最强",
		Content: HeroBeacon,
	},
	{
		title: "AI 疾书",
		description: "提问落下，AI 流式生成规约：思考、疾书、段间停顿",
		Content: HeroTerminal,
	},
	{ title: "浮动卡片", description: "规约、提示词、技能三张玻璃卡分层漂浮", Content: HeroCards },
];

export function LoginHeroDemoPage(): JSX.Element {
	return (
		<main className="mx-auto w-full max-w-5xl px-6 py-12">
			<motion.header
				className="mb-8 flex flex-col gap-1.5"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.24, ease: "easeOut" }}
			>
				<h1 className="font-semibold text-2xl tracking-tight">登录侧板品牌动画</h1>
				<p className="text-muted-foreground text-sm">
					前三个是「归纳 +
					复用」叙事系列，后五个是第一轮氛围系列；画布即登录页右栏的暗底与比例，点「重播」重看进场。
				</p>
			</motion.header>

			<div className="grid gap-5 md:grid-cols-2">
				{DEMOS.map(({ title, description, Content }, index) => (
					<motion.div
						key={title}
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.24, ease: "easeOut", delay: Math.min(index, 10) * 0.06 }}
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
