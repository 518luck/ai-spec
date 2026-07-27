"use client";

// # 规约分发场景：一份规约逐行写成、打上对勾，信号沿虚线飞向三个 AI 节点并逐个点亮——讲述"一次沉淀，处处生效"

import { motion, type Transition } from "motion/react";
import type { JSX } from "react";

// 主时间轴总时长（秒）：所有叙事元素共用同一 duration + times，保证循环永不漂移
const MASTER = 8;

// 点缀色：与左侧「冷石墨银」粒子标题同色系的亮银蓝，用于信号、点亮态与对勾
const ACCENT = "rgb(168, 180, 194)";

// 三个 AI 节点：位置、来自规约文档的连线路径、信号出发/到达时刻（主时间轴归一化）
const AGENT_NODES = [
	{ cx: 272, cy: 92, link: "M188 150C220 138 236 116 254 100", depart: 0.34, arrive: 0.46 },
	{ cx: 300, cy: 187, link: "M188 187C214 191 252 189 282 188", depart: 0.39, arrive: 0.51 },
	{ cx: 258, cy: 282, link: "M188 222C216 234 230 252 244 270", depart: 0.44, arrive: 0.56 },
] as const;

type AgentNode = (typeof AGENT_NODES)[number];

// 规约文档的三行内容：起点与长度错落，像真实条目
const RULE_LINES = [
	{ d: "M104 164h64", write: 0.02 },
	{ d: "M104 182h72", write: 0.1 },
	{ d: "M104 200h52", write: 0.18 },
] as const;

type RuleLine = (typeof RULE_LINES)[number];

// @ 主时间轴 transition 工厂：每个元素一个 times 数组同时驱动它的全部属性，时刻改一处整条链对齐

// 主时间轴公共参数
const masterTransition: Transition = {
	duration: MASTER,
	repeat: Number.POSITIVE_INFINITY,
	ease: "easeInOut",
};

// 按 times 生成主时间轴 transition
const masterTimes = (times: readonly number[]): Transition => ({
	...masterTransition,
	times: [...times],
});

// 内容行：在自己的窗口内写出，循环尾部淡出
const lineTimes = ({ write }: RuleLine): number[] => [0, write, write + 0.08, 0.93, 0.98];

// 信号可见窗口：出发时亮起、到达前保持、到达即熄灭
const signalOpacityTimes = ({ depart, arrive }: AgentNode): number[] => [
	0,
	depart,
	depart + 0.02,
	arrive - 0.02,
	arrive,
	1,
];

// 信号位移窗口：短亮线沿连线从文档滑向节点
const signalOffsetTimes = ({ depart, arrive }: AgentNode): number[] => [0, depart, arrive, 1];

// 点亮窗口：信号到达后亮起并保持，循环尾部熄灭
const litTimes = ({ arrive }: AgentNode): number[] => [0, arrive, arrive + 0.03, 0.91, 0.97];

// 脉冲环窗口：到达瞬间荡开一圈后消散
const pulseTimes = ({ arrive }: AgentNode): number[] => [
	0,
	arrive,
	arrive + 0.02,
	arrive + 0.08,
	1,
];

// 环境元素的往复 idle 循环：与主时间轴无关，各自错开周期
const bobTransition = (duration: number): Transition => ({
	duration,
	repeat: Number.POSITIVE_INFINITY,
	ease: "easeInOut",
});

export function SpecFlowScene(): JSX.Element {
	return (
		<motion.div
			className="flex flex-col items-center gap-10 px-10"
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
		>
			<svg
				className="w-(--scene-width) max-w-full text-muted-foreground [--scene-width:400px]"
				viewBox="0 0 360 360"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="规约写成后分发给多个 AI 节点并逐个点亮"
			>
				<defs>
					<radialGradient id="spec-flow-glow">
						<stop offset="0%" stopColor={ACCENT} stopOpacity={0.09} />
						<stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
					</radialGradient>
				</defs>

				{/* 环境层：中心微光、缓慢自转的虚线轨道与四角星点 */}
				<circle cx={180} cy={185} r={150} fill="url(#spec-flow-glow)" stroke="none" />
				<motion.circle
					cx={180}
					cy={185}
					r={148}
					opacity={0.08}
					strokeDasharray="2 10"
					animate={{ rotate: 360 }}
					transition={{ duration: 90, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
					style={{ transformBox: "fill-box", transformOrigin: "center" }}
				/>
				{[
					{ cx: 70, cy: 80, delay: 0 },
					{ cx: 320, cy: 60, delay: 1.1 },
					{ cx: 56, cy: 296, delay: 2.3 },
					{ cx: 330, cy: 322, delay: 0.7 },
				].map(({ cx, cy, delay }) => (
					<motion.circle
						key={`${cx}-${cy}`}
						cx={cx}
						cy={cy}
						r={1.5}
						className="fill-current"
						stroke="none"
						animate={{ opacity: [0.12, 0.55, 0.12] }}
						transition={{ ...bobTransition(3.4), delay }}
					/>
				))}

				{/* 连线底稿：常驻的暗虚线，勾出规约与节点的关系 */}
				{AGENT_NODES.map(({ link }) => (
					<path key={link} d={link} opacity={0.16} strokeDasharray="3 6" />
				))}

				{/* // > 规约文档：整体缓慢浮动；三行内容按窗口逐行写出，写完角落弹出对勾 */}
				<motion.g animate={{ y: [0, -3, 0] }} transition={bobTransition(5)}>
					<rect x={92} y={118} width={96} height={124} rx={10} opacity={0.75} />
					<circle cx={106} cy={136} r={2} className="fill-current" stroke="none" opacity={0.6} />
					<path d="M114 136h44" opacity={0.6} />
					<path d="M104 150h72" opacity={0.2} />

					{RULE_LINES.map((line) => (
						<motion.path
							key={line.d}
							d={line.d}
							initial={{ pathLength: 0 }}
							animate={{ pathLength: [0, 0, 1, 1, 1], opacity: [0.55, 0.55, 0.55, 0.55, 0] }}
							transition={masterTimes(lineTimes(line))}
						/>
					))}

					{/* 完成徽章：规约写满后在文档右下角弹出 */}
					<motion.g
						initial={{ opacity: 0 }}
						animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.5, 0.5, 1, 1, 0.9] }}
						transition={masterTimes([0, 0.28, 0.32, 0.93, 0.98])}
						style={{ transformBox: "fill-box", transformOrigin: "center" }}
					>
						<circle cx={186} cy={238} r={11} className="fill-background" stroke={ACCENT} />
						<path d="m181.5 238.5 3 3 6-7" stroke={ACCENT} />
					</motion.g>
				</motion.g>

				{/* 信号光条：外层组控制可见窗口，内层路径控制沿线滑动 */}
				{AGENT_NODES.map((node) => (
					<motion.g
						key={`signal-${node.link}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
						transition={masterTimes(signalOpacityTimes(node))}
					>
						<motion.path
							d={node.link}
							stroke={ACCENT}
							strokeWidth={2.5}
							initial={{ pathLength: 0.18, pathOffset: 0 }}
							animate={{ pathOffset: [0, 0, 0.82, 0.82] }}
							transition={masterTimes(signalOffsetTimes(node))}
						/>
					</motion.g>
				))}

				{/* AI 节点：暗态常驻，信号到达后点亮并荡开脉冲环，各自轻微浮动 */}
				{AGENT_NODES.map((node, index) => (
					<motion.g
						key={`node-${node.link}`}
						animate={{ y: [0, index % 2 === 0 ? -2.5 : 2.5, 0] }}
						transition={{ ...bobTransition(3.8 + index * 0.7), delay: index * 0.5 }}
					>
						<g transform={`translate(${node.cx} ${node.cy})`}>
							<circle r={17} opacity={0.35} />
							<path
								d="M0 -6.5c0.9 3.7 2.8 5.6 6.5 6.5-3.7 0.9-5.6 2.8-6.5 6.5-0.9-3.7-2.8-5.6-6.5-6.5 3.7-0.9 5.6-2.8 6.5-6.5Z"
								className="fill-current"
								stroke="none"
								opacity={0.3}
							/>
							{/* 点亮层：叠在暗态之上，随主时间轴亮起/熄灭 */}
							<motion.g
								initial={{ opacity: 0 }}
								animate={{ opacity: [0, 0, 1, 1, 0] }}
								transition={masterTimes(litTimes(node))}
							>
								<circle r={17} stroke={ACCENT} />
								<path
									d="M0 -6.5c0.9 3.7 2.8 5.6 6.5 6.5-3.7 0.9-5.6 2.8-6.5 6.5-0.9-3.7-2.8-5.6-6.5-6.5 3.7-0.9 5.6-2.8 6.5-6.5Z"
									fill={ACCENT}
									stroke="none"
								/>
							</motion.g>
							<motion.circle
								r={17}
								stroke={ACCENT}
								initial={{ opacity: 0 }}
								animate={{ opacity: [0, 0, 0.5, 0, 0], scale: [0.75, 0.75, 1, 1.5, 1.5] }}
								transition={masterTimes(pulseTimes(node))}
								style={{ transformBox: "fill-box", transformOrigin: "center" }}
							/>
						</g>
					</motion.g>
				))}
			</svg>

			<div className="flex flex-col items-center gap-2 text-center">
				<h2 className="font-semibold text-foreground text-xl">把团队规约，交给每一个 AI</h2>
				<p className="text-muted-foreground text-sm">规约、提示词与技能一次沉淀，处处生效</p>
			</div>
		</motion.div>
	);
}
