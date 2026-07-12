// # 侧边栏持久化：宽度节流写入 cookie，折叠状态立即写入

import { setCookie } from "@/shared/lib/cookie/client-cookie";
import { COOKIE_DEFAULTS } from "@/shared/lib/cookie/cookies";

import { SIDEBAR_COLLAPSED_COOKIE, SIDEBAR_WIDTH_COOKIE } from "./sidebar-config";

// 宽度写入节流句柄：拖拽过程高频调用，避免每次 pointermove 都写 cookie
let widthFlushTimer: ReturnType<typeof setTimeout> | null = null;

// > 持久化侧边栏宽度（节流 150ms），供拖拽过程高频调用
export const saveSidebarWidth = (width: number): void => {
	if (widthFlushTimer !== null) {
		clearTimeout(widthFlushTimer);
	}
	widthFlushTimer = setTimeout(() => {
		setCookie(SIDEBAR_WIDTH_COOKIE, String(width), COOKIE_DEFAULTS);
		widthFlushTimer = null;
	}, 150);
};

// 持久化折叠状态（立即写入），折叠是离散切换无需节流
export const saveSidebarCollapsed = (collapsed: boolean): void => {
	setCookie(SIDEBAR_COLLAPSED_COOKIE, String(collapsed), COOKIE_DEFAULTS);
};
