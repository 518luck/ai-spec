"use client";

// # 骨架交叉淡出：加载完成时骨架不是直接消失，而是和真实内容错开半拍交替，避免整块闪一下

import { AnimatePresence, motion } from "motion/react";
import { type JSX, useEffect, useState } from "react";

import { Skeleton } from "@/shared/ui/skeleton";
import { ENTER_TRANSITION, staggerDelay } from "../lib/presets";

// 演示用的假加载时长（毫秒）
const FAKE_LATENCY = 1000;

const ROWS = [
	{ title: "命名规范", meta: "12 条 · 3 天前更新" },
	{ title: "提交信息模板", meta: "5 条 · 昨天更新" },
	{ title: "代码评审清单", meta: "8 条 · 1 小时前更新" },
] as const;

export function DemoSkeleton(): JSX.Element {
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setLoaded(true), FAKE_LATENCY);
		return () => clearTimeout(timer);
	}, []);

	return (
		// > mode="wait"：等骨架完全退场再放内容进场，两层不会在同一帧重叠成"双份行高"
		<AnimatePresence mode="wait">
			{loaded ? (
				<motion.ul
					key="content"
					className="flex flex-col gap-2"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
				>
					{ROWS.map((row, index) => (
						<motion.li
							key={row.title}
							className="flex flex-col gap-1 rounded-lg border border-border bg-background px-3 py-2"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...ENTER_TRANSITION, delay: staggerDelay(index) }}
						>
							<span className="font-medium text-sm">{row.title}</span>
							<span className="text-muted-foreground text-xs">{row.meta}</span>
						</motion.li>
					))}
				</motion.ul>
			) : (
				<motion.div
					key="skeleton"
					className="flex flex-col gap-2"
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
				>
					{ROWS.map((row) => (
						<div
							key={row.title}
							className="flex flex-col gap-2 rounded-lg border border-border px-3 py-3"
						>
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-2.5 w-40" />
						</div>
					))}
				</motion.div>
			)}
		</AnimatePresence>
	);
}
