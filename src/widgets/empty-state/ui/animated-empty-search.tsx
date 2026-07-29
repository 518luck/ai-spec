"use client";

// # 扫描搜寻空状态：放大镜在幽灵文档上来回扫了两遍一无所获，停在中间冒出问号，歇一口气再从头找起

import { motion, type Transition } from "motion/react";
import type { JSX } from "react";

// 通用进场：短促上浮淡入，压在 0.24s 内保证不拖沓
const ENTER_TRANSITION: Transition = {
	duration: 0.24,
	ease: "easeOut",
};

type IdleLoopOptions = {
	duration: number;
	delay?: number;
	repeatDelay?: number;
};

// idle 循环工厂：进场结束后开始的无限往复动画，幅度小、节奏慢，负责"插画一直活着"的呼吸感
const idleLoop = ({ duration, delay = 0, repeatDelay = 0 }: IdleLoopOptions): Transition => ({
	duration,
	delay,
	repeat: Number.POSITIVE_INFINITY,
	repeatDelay,
	ease: "easeInOut",
});

// 进场错峰：文档先淡入，放大镜随后滑入，文案最后跟上
const MAGNIFIER_ENTER_DELAY = 0.12;
const TEXT_ENTER_DELAY = 0.4;

// > 主循环时间轴：所有 idle 元素共用同一总时长与 times 刻度，多元素叙事才永不漂移
const LOOP_DURATION = 5;
const LOOP_REPEAT_DELAY = 1;
const IDLE_DELAY = 0.9;

// 放大镜扫描轨迹：左右扫两遍后回到中间停住，y 轻微起伏带出手持感
const SCAN_TIMES = [0, 0.1, 0.34, 0.58, 0.7, 1];
const SCAN_X = [0, -10, 10, -10, 0, 0];
const SCAN_Y = [0, -1.5, 1.5, -1.5, 0, 0];

// 虚线内容的明暗两档：平时看不清，被镜片扫过时短暂提亮
const LINE_DIM = 0.35;
const LINE_BRIGHT = 0.8;

// 幽灵文档的三条内容线，长短不一表示残缺模糊的信息
const DOC_LINES = [
	{ y: 21, endX: 41 },
	{ y: 30, endX: 37 },
	{ y: 39, endX: 32 },
];

// 问号气泡：放大镜停稳后带过冲地弹出，循环末尾随整体一起淡出
const HINT_TIMES = [0, 0.72, 0.78, 0.84, 0.94, 1];
const HINT_SCALE = [0, 0, 1.15, 1, 1, 1];
const HINT_OPACITY = [0, 0, 1, 1, 1, 0];

// 主循环公共 transition：统一时长与间歇，各元素只替换自己的 times 刻度
const scanTransition = (times: number[]): Transition => ({
	...idleLoop({
		duration: LOOP_DURATION,
		delay: IDLE_DELAY,
		repeatDelay: LOOP_REPEAT_DELAY,
	}),
	times,
});

// 按行号推出该行两次被扫过的提亮时刻：第一趟自上而下依次、第二趟折返倒序
const lineHighlight = (index: number): { opacity: number[]; times: number[] } => {
	const firstPass = 0.16 + index * 0.06;
	const secondPass = 0.52 - index * 0.06;
	return {
		opacity: [LINE_DIM, LINE_BRIGHT, LINE_DIM, LINE_BRIGHT, LINE_DIM, LINE_DIM],
		times: [0, firstPass, 0.34, secondPass, 0.64, 1],
	};
};

export function AnimatedEmptySearch(): JSX.Element {
	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<svg
				className="size-24 text-muted-foreground"
				viewBox="0 0 64 64"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="放大镜在文档上搜索，没有找到结果"
			>
				{/* 幽灵文档：低透明度轮廓加三条虚线，表示看不清的内容 */}
				<motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={ENTER_TRANSITION}>
					<rect x={17} y={9} width={30} height={46} rx={4} opacity={0.5} />
					{DOC_LINES.map((line, index) => {
						const highlight = lineHighlight(index);
						return (
							<motion.line
								key={line.y}
								x1={22}
								y1={line.y}
								x2={line.endX}
								y2={line.y}
								strokeDasharray="4 5"
								initial={{ opacity: LINE_DIM }}
								animate={{ opacity: highlight.opacity }}
								transition={scanTransition(highlight.times)}
							/>
						);
					})}
				</motion.g>

				{/* 放大镜：外层只管从侧边滑入进场，内层承担扫描循环，两层 transform 互不干扰 */}
				<motion.g
					className="text-foreground"
					initial={{ opacity: 0, x: -16 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ ...ENTER_TRANSITION, delay: MAGNIFIER_ENTER_DELAY }}
				>
					<motion.g animate={{ x: SCAN_X, y: SCAN_Y }} transition={scanTransition(SCAN_TIMES)}>
						<circle cx={32} cy={32} r={7} />
						<line x1={37} y1={37} x2={42} y2={42} />
					</motion.g>
				</motion.g>

				{/* 问号气泡：以贴近镜片的底部为支点向上弹出 */}
				<motion.g
					className="text-primary"
					style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
					initial={{ opacity: 0, scale: 0 }}
					animate={{ opacity: HINT_OPACITY, scale: HINT_SCALE }}
					transition={scanTransition(HINT_TIMES)}
				>
					<circle cx={45} cy={20} r={6} fill="currentColor" fillOpacity={0.1} />
					<text
						x={45}
						y={23}
						textAnchor="middle"
						fontSize={8}
						fontWeight={600}
						fill="currentColor"
						stroke="none"
					>
						?
					</text>
				</motion.g>
			</svg>

			<motion.div
				className="flex flex-col gap-1"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ ...ENTER_TRANSITION, delay: TEXT_ENTER_DELAY }}
			>
				<p className="font-medium text-sm">没有匹配的结果</p>
				<p className="text-muted-foreground text-xs">换个关键词，或清空筛选试试</p>
			</motion.div>
		</div>
	);
}
