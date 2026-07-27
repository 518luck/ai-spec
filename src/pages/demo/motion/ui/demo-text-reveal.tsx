"use client";

// # 逐词升起：每个词裹一层 overflow-hidden 遮罩，词从遮罩下沿推上来，比整段淡入更像"被逐字写出来"

import { motion } from "motion/react";
import type { JSX } from "react";

import { REVEAL_EASE } from "../lib/presets";

const WORDS = ["把", "团队规约", "写成", "可执行的", "上下文"] as const;

// 逐词间隔（秒）：太大就散、太小又看不出先后，0.07 左右刚好读得出顺序
const WORD_STEP = 0.07;

export function DemoTextReveal(): JSX.Element {
	return (
		<div className="flex flex-col items-center gap-3 text-center">
			<h3 className="flex flex-wrap justify-center gap-x-2 font-semibold text-2xl tracking-tight">
				{WORDS.map((word, index) => (
					// 遮罩层：只负责裁掉词升起前露在基线以下的部分
					<span key={word} className="inline-block overflow-hidden pb-1">
						<motion.span
							className="inline-block"
							initial={{ y: "110%" }}
							animate={{ y: "0%" }}
							transition={{ duration: 0.5, ease: REVEAL_EASE, delay: index * WORD_STEP }}
						>
							{word}
						</motion.span>
					</span>
				))}
			</h3>

			<motion.p
				className="text-muted-foreground text-sm"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.4, delay: WORDS.length * WORD_STEP + 0.15 }}
			>
				副标题排在最后一个词之后淡入
			</motion.p>
		</div>
	);
}
