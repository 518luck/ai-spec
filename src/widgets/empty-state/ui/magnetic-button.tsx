"use client";

// # 磁吸按钮：指针进入范围后按钮朝指针偏移一小段，离开时弹回原位，做出"被吸住"的手感

import { motion, useMotionValue, useSpring } from "motion/react";
import { type JSX, type PointerEvent, useState } from "react";

// 吸附强度：指针到按钮中心距离乘这个系数就是偏移量，超过 0.5 会跟得太黏、像按钮在逃
const MAGNET_STRENGTH = 0.35;

// 回弹参数：damping 压得比较高，回位时只回一次不来回晃
const MAGNET_SPRING = { stiffness: 260, damping: 18, mass: 0.6 };

export type MagneticButtonProps = {
	// 按钮文案
	label: string;
	// 点击回调
	onClick: () => void;
};

export function MagneticButton({ label, onClick }: MagneticButtonProps): JSX.Element {
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
		<motion.button
			type="button"
			className="rounded-md bg-primary px-4 py-1.5 font-medium text-primary-foreground text-xs"
			style={{ x: springX, y: springY }}
			animate={{ scale: hovered ? 1.06 : 1, opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: "easeOut" }}
			initial={{ opacity: 0, y: 8 }}
			onPointerEnter={() => setHovered(true)}
			onPointerMove={handleMove}
			onPointerLeave={handleLeave}
			onClick={onClick}
		>
			{label}
		</motion.button>
	);
}
