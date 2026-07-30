"use client";

// # 快速回顶按钮：监听滚动容器，越过阈值后右下角浮出，点击平滑滚回顶部

import { AnimatePresence, motion } from "motion/react";
import { type JSX, type RefObject, useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type BackToTopButtonProps = {
	/** 真实滚动容器（页壳 ScrollArea 的 viewport，或原生 overflow 节点） */
	scrollRef: RefObject<HTMLElement | null>;
	/** 滚过多少 px 后显示按钮，默认约一屏 */
	threshold?: number;
	className?: string;
};

// 右下角悬浮回顶：仅在向下滚过阈值后出现，点击后平滑回到顶部
export function BackToTopButton({
	scrollRef,
	threshold = 480,
	className,
}: BackToTopButtonProps): JSX.Element {
	const [visible, setVisible] = useState(false);

	// 监听目标容器滚动位置，越过阈值才露出按钮
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;

		const updateVisible = (): void => {
			setVisible(el.scrollTop > threshold);
		};

		updateVisible();
		el.addEventListener("scroll", updateVisible, { passive: true });
		return () => el.removeEventListener("scroll", updateVisible);
	}, [scrollRef, threshold]);

	// 平滑滚回顶部
	const handleClick = (): void => {
		scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<AnimatePresence>
			{visible ? (
				<motion.div
					key="back-to-top"
					className={cn("pointer-events-auto absolute right-6 bottom-6 z-20", className)}
					initial={{ opacity: 0, y: 8, scale: 0.96 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 8, scale: 0.96 }}
					transition={{ duration: 0.18, ease: "easeOut" }}
				>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									type="button"
									size="icon"
									variant="outline"
									aria-label="回到顶部"
									onClick={handleClick}
									className="size-10 rounded-full bg-background/90 shadow-md backdrop-blur-sm"
								>
									<Icons.arrowUp className="size-4" />
								</Button>
							}
						/>
						<TooltipContent side="left">回到顶部</TooltipContent>
					</Tooltip>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
