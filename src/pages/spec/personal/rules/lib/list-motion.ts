// # 规约列表动效参数：视图切换的整块进出场 + 列表项错峰入场；表格与卡片共用同一套节奏，两种视图切换手感一致

import type { Transition } from "motion/react";

// 视图切换：新内容上浮淡入、旧内容下沉淡出，压在 0.2s 内保证点击跟手
export const LIST_SWITCH_MOTION = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -6 },
	transition: { duration: 0.18, ease: "easeOut" },
} as const;

// 卡片入场：上浮 + 轻微放大，配合网格的块状排布
export const CARD_ITEM_MOTION = {
	initial: { opacity: 0, y: 12, scale: 0.97 },
	animate: { opacity: 1, y: 0, scale: 1 },
} as const;

// ! 表格行只做透明度：<tr> 上的 transform 会生成包含块，把边框和横向滚动挤歪
export const ROW_ITEM_MOTION = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
} as const;

// 错峰步长（秒）与封顶索引：超过封顶的项共用同一延迟，列表再长尾部也不会等太久
const STAGGER_STEP = 0.03;
const STAGGER_MAX_INDEX = 12;

// 列表项入场过渡：按索引错峰，越靠后越晚出现，到封顶索引后不再累加
export const itemTransition = (index: number): Transition => ({
	duration: 0.24,
	ease: "easeOut",
	delay: Math.min(index, STAGGER_MAX_INDEX) * STAGGER_STEP,
});
