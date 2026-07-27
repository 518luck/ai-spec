// # 通用动效参数：跨组件共享、必须两端对齐的过渡曲线

import type { Transition } from "motion/react";

// 形变飞行时长（秒）：内容淡入的 delay 由它推出来，改这一个值两边一起走
const MORPH_DURATION = 0.26;

// ! 卡片 ↔ 编辑弹窗的形变过渡：两侧共用同一个 layoutId，也必须共用同一条曲线，否则去程回程手感对不上
// > bounce 给 0：形变的是一整块面板，回弹会让四条边来回甩，看着就像糊了一层
export const MORPH_TRANSITION: Transition = {
	type: "spring",
	duration: MORPH_DURATION,
	bounce: 0,
};

// ! 面板内容淡入必须整个排在形变之后：文字不跟着缩放，提前出现会在还没长到位的面板外面露出来一截
export const MORPH_CONTENT_TRANSITION: Transition = {
	duration: 0.16,
	delay: MORPH_DURATION,
	ease: "easeOut",
};

// ! 圆角写进 style 不能写 className：motion 只有拿到数值才能在缩放过程中逐帧反向修正圆角，
// ! 用 rounded-* 类名的话圆角会被缩放一起拉长，四个角看起来发虚
export const MORPH_RADIUS = {
	// 卡片侧，对齐 rounded-lg
	card: 8,
	// 弹窗侧，对齐 rounded-xl
	panel: 12,
} as const;
