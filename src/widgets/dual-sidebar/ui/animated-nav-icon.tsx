"use client";

// # 导航图标悬停动画：按 NavIconAnimation 配置渲染旋转/抖动/无动画三种反馈

import { motion } from "motion/react";
import type { JSX, ReactNode } from "react";

import type { NavIconAnimation } from "../model/navigation-data";

type AnimatedNavIconProps = {
	animation?: NavIconAnimation;
	children: ReactNode;
};

// 为导航图标提供可配置的悬停动画反馈。
export function AnimatedNavIcon({
	animation = "none",
	children,
}: AnimatedNavIconProps): JSX.Element {
	if (animation === "rotate") {
		return (
			<motion.span
				className="inline-flex size-full items-center justify-center"
				whileHover={{ rotate: 360 }}
				transition={{ duration: 0.45, ease: "easeInOut" }}
			>
				{children}
			</motion.span>
		);
	}

	if (animation === "shake") {
		return (
			<motion.span
				className="inline-flex size-full items-center justify-center"
				whileHover={{
					rotate: [0, -8, 8, -5, 5, 0],
					x: [0, -2, 2, -1, 1, 0],
				}}
				transition={{ duration: 0.4, ease: "easeInOut" }}
			>
				{children}
			</motion.span>
		);
	}

	return <span className="inline-flex items-center justify-center">{children}</span>;
}
