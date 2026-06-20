import { SIDEBAR_COLLAPSED_COOKIE, SIDEBAR_WIDTH_COOKIE } from "./sidebar-config";

// cookie 写入：1 年有效期、同源、SameSite=Lax
const writeCookie = (name: string, value: string): void => {
  document.cookie = `${name}=${value};path=/;max-age=31536000;samesite=lax`;
};

// 宽度写入节流句柄：拖拽过程高频调用，避免每次 pointermove 都写 cookie
let widthFlushTimer: ReturnType<typeof setTimeout> | null = null;

// 持久化侧边栏宽度（节流 150ms），供拖拽过程高频调用
export const saveSidebarWidth = (width: number): void => {
  if (widthFlushTimer !== null) {
    clearTimeout(widthFlushTimer);
  }
  widthFlushTimer = setTimeout(() => {
    writeCookie(SIDEBAR_WIDTH_COOKIE, String(width));
    widthFlushTimer = null;
  }, 150);
};

// 持久化折叠状态（立即写入），折叠是离散切换无需节流
export const saveSidebarCollapsed = (collapsed: boolean): void => {
  writeCookie(SIDEBAR_COLLAPSED_COOKIE, String(collapsed));
};
