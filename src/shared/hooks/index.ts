// # Hooks Barrel：本目录唯一对外出口，自实现 hook 与第三方 hook 转发都从这里统一导入

// @ 第三方 hook 转发
export { useInView } from "react-intersection-observer"; // 监听元素与视口/滚动容器的交叉状态

// @ 自实现 hook
export { useLocalStorage } from "./use-local-storage"; // 读写 localStorage，setter 支持函数式更新（无 stale closure）
export { useMediaQuery } from "./use-media-query"; // 设备类型（mobile/tablet/desktop）+ 窗口尺寸
export { useIsMobile } from "./use-mobile"; // 视口是否为移动端（768px 断点）
export { useMounted } from "./use-mounted"; // 组件是否已挂载，SSR 安全，挂载后驱动渲染
export { useResizeObserver } from "./use-resize-observer"; // 监听元素尺寸变化，返回最新 entry
export { useScrollProgress } from "./use-scroll-progress"; // 可滚动容器的滚动进度（0~1）
