"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { useMounted } from "@/shared/hooks";

type ClientOnlyProps = {
	children: ReactNode;
	fallback?: ReactNode;
	fadeInDuration?: number;
	className?: string;
};

// ! 只在浏览器客户端渲染 children：用 useMounted 保证服务端与客户端首屏一致，避免 hydration 不匹配
export function ClientOnly({
	children,
	fallback,
	fadeInDuration = 0.5,
	className,
}: ClientOnlyProps): ReactNode {
	const mounted = useMounted();

	const Comp = fadeInDuration ? motion.div : "div";

	return (
		<AnimatePresence>
			{mounted ? (
				<Comp
					{...(fadeInDuration
						? {
								initial: { opacity: 0 },
								animate: { opacity: 1 },
								transition: { duration: fadeInDuration },
							}
						: {})}
					className={className}
				>
					{children}
				</Comp>
			) : (
				(fallback ?? null)
			)}
		</AnimatePresence>
	);
}
