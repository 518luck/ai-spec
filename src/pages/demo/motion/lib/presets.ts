// # 演示动效参数：出场曲线与错峰节奏收在一处，改一个值所有示例同步跟着变

import type { Transition } from "motion/react";

// 通用出场：短促上浮淡入，压在 0.24s 内保证不拖沓
export const ENTER_TRANSITION: Transition = {
	duration: 0.24,
	ease: "easeOut",
};

// 弹性出场：带一点回弹，用在需要"蹦"一下的图标、徽标
export const SPRING_TRANSITION: Transition = {
	type: "spring",
	stiffness: 320,
	damping: 20,
};

// 遮罩升起曲线：起步快、尾巴长，文字从遮罩下沿升上来时最像"被写出来"
export const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

// 错峰步长（秒）与封顶索引：超过封顶的项共用同一延迟，列表再长尾部也不会等太久
const STAGGER_STEP = 0.06;
const STAGGER_MAX_INDEX = 10;

// 按索引推出错峰延迟
export const staggerDelay = (index: number): number =>
	Math.min(index, STAGGER_MAX_INDEX) * STAGGER_STEP;
