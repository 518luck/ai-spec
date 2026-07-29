"use client";

// # 飘落归档动画空状态：文件夹敞着口等内容，文档、图片、代码图标一张张荡着落进夹口、被前盖遮住消失——"空"变成"正在等待被填满"

import { motion, type Transition } from "motion/react";
import type { JSX, ReactNode } from "react";

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

// 文案在文件夹进场收尾时上浮，idle 循环再晚一拍开始，保证进场画面先稳定
const TEXT_DELAY = 0.2;
const IDLE_START = 0.6;

// 单张图标卡片的下落时长（秒）：三张的接力延迟与 repeatDelay 都由它推出，改这一个值整条链自动对齐
const CARD_FALL_DURATION = 2.4;

// 三张图标卡片的基准横位、摆动方向与图标内容：文档、图片、代码轮流飘入，像各种内容都在归档进来
const CARDS = [
	{ x: 26, sway: 1, Glyph: DocGlyph },
	{ x: 22, sway: -1, Glyph: ImageGlyph },
	{ x: 30, sway: 1, Glyph: CodeGlyph },
] as const;

// 图标卡片飘落节奏：第 index 张排队等前面的落完再落，落完再等满一整轮重来，三张首尾相接永不漂移
const cardFallTransition = (index: number): Transition => ({
	duration: CARD_FALL_DURATION,
	delay: IDLE_START + index * CARD_FALL_DURATION,
	repeat: Number.POSITIVE_INFINITY,
	repeatDelay: CARD_FALL_DURATION * (CARDS.length - 1),
	ease: "easeInOut",
	times: [0, 0.3, 0.55, 0.8, 1],
});

type AnimatedEmptyFolderProps = {
	// 前盖中央的页面标识图标：传所属页面的 Icons 组件实例，让不同界面的空状态一眼可辨
	icon?: ReactNode;
	// 主标题文案
	title?: string;
	// 副标题文案
	description?: string;
};

// > 动画空状态文件夹：飘落归档 SVG 动画 + 标题文案
export function AnimatedEmptyFolder({
	icon,
	title,
	description,
}: AnimatedEmptyFolderProps): JSX.Element {
	return (
		<div className="flex flex-col items-center text-center">
			<motion.svg
				className="size-24 text-muted-foreground"
				viewBox="0 0 64 64"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				role="img"
				aria-label="文档、图片、代码图标飘落进空文件夹"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={ENTER_TRANSITION}
			>
				{/* 文件夹后片：背板与标签耳朵 */}
				<path d="M10 45V20a3 3 0 0 1 3-3h9l4 4h25a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3Z" />

				{/* // > 图标卡片画在后片之后、前片之前：落到夹口以下即被前盖自然遮住，看起来像"进去了" */}
				{CARDS.map(({ x, sway, Glyph }, index) => (
					<motion.g
						key={x}
						initial={{ opacity: 0 }}
						animate={{
							y: [-18, -6, 6, 18, 30],
							x: [0, -4 * sway, 4 * sway, -2 * sway, 0],
							rotate: [0, -10 * sway, 10 * sway, -6 * sway, 0],
							opacity: [0, 1, 1, 1, 0],
						}}
						transition={cardFallTransition(index)}
						style={{ transformBox: "fill-box", transformOrigin: "center" }}
					>
						{/* 卡片底板带不透明底色，飘过背板边线时不会透出底下的描边 */}
						<rect className="fill-background" x={x} y={2} width={12} height={14} rx={2} />
						<Glyph x={x} />
					</motion.g>
				))}

				{/* 文件夹前片：不透明盖板遮住落入的卡片，与页面标识图标作为整体以底边为支点轻微开合呼吸 */}
				<motion.g
					animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
					transition={idleLoop({ duration: 3.2, delay: IDLE_START })}
					style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}
				>
					<path
						className="fill-background"
						d="M8 31a3 3 0 0 1 3-3h42a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3Z"
					/>
					{/* 图标槽：嵌套 svg 把 24×24 的图标组件缩放定位到前盖中央；语义已由外层 aria-label 承担，此处纯装饰 */}
					{icon ? (
						<svg aria-hidden="true" x={25} y={31} width={14} height={14} viewBox="0 0 24 24">
							{icon}
						</svg>
					) : null}
				</motion.g>
			</motion.svg>

			<motion.div
				className="flex flex-col items-center gap-1"
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ ...ENTER_TRANSITION, delay: TEXT_DELAY }}
			>
				{title ? <p className="font-medium text-sm">{title}</p> : null}
				{description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
			</motion.div>
		</div>
	);
}

type GlyphProps = {
	x: number;
};

// 文档图标：两行文字线
function DocGlyph({ x }: GlyphProps): JSX.Element {
	return (
		<>
			<path d={`M${x + 3} 7h6`} />
			<path d={`M${x + 3} 11h4`} />
		</>
	);
}

// 图片图标：右上小太阳加一座山峰
function ImageGlyph({ x }: GlyphProps): JSX.Element {
	return (
		<>
			<circle cx={x + 8.8} cy={6} r={1.2} />
			<path d={`M${x + 2.5} 12.5l3.5-4 3.5 4`} />
		</>
	);
}

// 代码图标：一对尖括号
function CodeGlyph({ x }: GlyphProps): JSX.Element {
	return (
		<>
			<path d={`M${x + 4.5} 6.5l-2.5 3 2.5 3`} />
			<path d={`M${x + 7.5} 6.5l2.5 3-2.5 3`} />
		</>
	);
}
