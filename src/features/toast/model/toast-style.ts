// # sonner toast 样式配置
// > 类型的 bg/text/border 配色统一在 styles/toast.css 里定义（CSS 变量）
// > 这里只放 CSS 没覆盖的组件级变量

// Toaster 组件级变量：圆角跟随主题
export const TOAST_STYLE = {
	"--border-radius": "var(--radius)",
} as React.CSSProperties;
