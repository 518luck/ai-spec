// # 空状态动效参数：进场曲线、错峰节奏与 idle 循环工厂收在一处，所有示例共用同一套节奏

import type { Transition } from "motion/react";

// 通用进场：短促上浮淡入，压在 0.24s 内保证不拖沓
export const ENTER_TRANSITION: Transition = {
	duration: 0.24,
	ease: "easeOut",
};

// 弹性进场：带一点回弹，用在需要"蹦"一下的图标、气泡
export const SPRING_TRANSITION: Transition = {
	type: "spring",
	stiffness: 320,
	damping: 20,
};

// 错峰步长（秒）与封顶索引：超过封顶的项共用同一延迟，列表再长尾部也不会等太久
const STAGGER_STEP = 0.06;
const STAGGER_MAX_INDEX = 10;

// 按索引推出错峰延迟
export const staggerDelay = (index: number): number =>
	Math.min(index, STAGGER_MAX_INDEX) * STAGGER_STEP;

type IdleLoopOptions = {
	duration: number;
	delay?: number;
	repeatDelay?: number;
};

// idle 循环工厂：进场结束后开始的无限往复动画，幅度小、节奏慢，负责"插画一直活着"的呼吸感
export const idleLoop = ({
	duration,
	delay = 0,
	repeatDelay = 0,
}: IdleLoopOptions): Transition => ({
	duration,
	delay,
	repeat: Number.POSITIVE_INFINITY,
	repeatDelay,
	ease: "easeInOut",
});
