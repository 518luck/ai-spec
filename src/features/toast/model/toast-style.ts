// # sonner toast 样式配置
// > 背景的磨砂半透明效果在 global.css 的 [data-sonner-toast] 选择器中定义（需更高优先级覆盖 sonner 内部预设）

// Toaster 组件级变量：文字色、边框色、圆角跟随主题变量
export const TOAST_STYLE = {
	"--normal-text": "var(--popover-foreground)",
	"--normal-border": "var(--border)",
	"--border-radius": "var(--radius)",
} as React.CSSProperties;
