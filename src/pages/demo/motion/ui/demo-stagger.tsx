"use client";

// # 错峰浮现：列表首屏逐项上浮，用极小的时间差把"一整块突然出现"拆成"内容正在铺开"

import { motion } from "motion/react";
import type { JSX } from "react";

import { ENTER_TRANSITION, staggerDelay } from "../lib/presets";

const ITEMS = ["规约总览", "命名规范", "提交信息模板", "代码评审清单", "发布流程"] as const;

export function DemoStagger(): JSX.Element {
	return (
		<ul className="flex flex-col gap-2">
			{ITEMS.map((item, index) => (
				<motion.li
					key={item}
					className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ ...ENTER_TRANSITION, delay: staggerDelay(index) }}
				>
					<span className="size-1.5 rounded-full bg-primary" />
					{item}
				</motion.li>
			))}
		</ul>
	);
}
