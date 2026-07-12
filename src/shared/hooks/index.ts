// # Hooks Barrel：本目录唯一对外出口，自实现 hook 与 react-use 转发都从这里统一导入

// @ react-use 转发：通用 hooks 透传，调用方无需关心来源
export { useLocalStorage } from "react-use"; // 读写 localStorage，像 useState 一样触发渲染

// @ 自实现 hook：react-use 无等价物或 API 不满足时的定制实现
export { useMediaQuery } from "./use-media-query"; // 设备类型（mobile/tablet/desktop）+ 窗口尺寸
export { useIsMobile } from "./use-mobile"; // 视口是否为移动端（768px 断点）
export { useMounted } from "./use-mounted"; // 组件是否已挂载，SSR 安全，挂载后驱动渲染
export { useResizeObserver } from "./use-resize-observer"; // 监听元素尺寸变化，返回最新 entry
export { useScrollProgress } from "./use-scroll-progress"; // 可滚动容器的滚动进度（0~1）
