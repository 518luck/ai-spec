"use client";

// # 磁吸按钮：指针进入范围后按钮朝指针偏移一小段，离开时弹回原位，做出"被吸住"的手感

import { motion, useMotionValue, useSpring } from "motion/react";
import { type JSX, type PointerEvent, useState } from "react";

// 吸附强度：指针到按钮中心距离乘这个系数就是偏移量，超过 0.5 会跟得太黏、像按钮在逃
const MAGNET_STRENGTH = 0.35;

// 回弹参数：damping 压得比较高，回位时只回一次不来回晃
const MAGNET_SPRING = { stiffness: 260, damping: 18, mass: 0.6 };

export function DemoMagnetic(): JSX.Element {
	const [hovered, setHovered] = useState(false);
	const offsetX = useMotionValue(0);
	const offsetY = useMotionValue(0);
	const springX = useSpring(offsetX, MAGNET_SPRING);
	const springY = useSpring(offsetY, MAGNET_SPRING);

	// 把指针位置换算成相对按钮中心的偏移
	const handleMove = (event: PointerEvent<HTMLButtonElement>) => {
		const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
		offsetX.set((event.clientX - left - width / 2) * MAGNET_STRENGTH);
		offsetY.set((event.clientY - top - height / 2) * MAGNET_STRENGTH);
	};

	// 指针离开就把目标值归零，spring 负责把按钮送回原位
	const handleLeave = () => {
		setHovered(false);
		offsetX.set(0);
		offsetY.set(0);
	};

	return (
		<div className="flex flex-col items-center gap-4">
			<motion.button
				type="button"
				className="rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground text-sm"
				style={{ x: springX, y: springY }}
				animate={{ scale: hovered ? 1.06 : 1 }}
				transition={{ duration: 0.2, ease: "easeOut" }}
				onPointerEnter={() => setHovered(true)}
				onPointerMove={handleMove}
				onPointerLeave={handleLeave}
			>
				开始创建
			</motion.button>

			<p className="text-muted-foreground text-xs">把指针移到按钮附近</p>
		</div>
	);
}
