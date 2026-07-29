# CSS 与布局

> Tailwind v4。引用 CSS 变量的 arbitrary value 用 v4 简写 `prop-(--var)`，不写 `prop-[var(--var)]`；计算表达式（`[calc(...)]`、`[min(...)]`）除外。

## Flexbox 主容器

主 flex 容器需要子元素填满高度时，保持默认 `items-stretch`（不要误用 `items-center` 导致子元素只撑到内容高度）：

```tsx
// ✅ 子元素填满高度
<div className="flex h-screen">{/* ... */}</div>
// ❌ 子元素只有内容高度
<div className="flex h-screen items-center">{/* ... */}</div>
```

## 可滚动 flex 子元素用 min-h-0

flex 子元素需内部滚动时加 `min-h-0`（flex 子默认 `min-height: auto` 会阻止 overflow 生效）：

```tsx
<div className="flex h-screen flex-col">
  <header className="h-16 shrink-0 border-b">{/* 固定高度 */}</header>
  <div className="flex min-h-0 flex-1">
    <aside className="w-64 shrink-0 overflow-y-auto border-r">{/* 侧栏 */}</aside>
    <main className="min-w-0 flex-1 overflow-y-auto">{/* 滚动内容 */}</main>
  </div>
</div>
```

## 父子职责分离

- 父组件控制外部样式：定位（absolute/grid span）、外部间距（margin/gap）、尺寸约束（width/max-width）。
- 子组件控制内部样式：内边距、内部布局（flex/grid）、背景/边框/阴影、排版。

```tsx
// 父：grid 位置 + 间距
<div className="grid gap-6 lg:grid-cols-3">
  <Card className="lg:col-span-2" />
</div>

// 子：内部样式 + 透传 className
export const Card = ({ className }: { className?: string }) => (
  <div className={cn("rounded-lg border bg-card p-4 shadow-sm", className)} />
);
```

## 移动端触摸

- 禁用 WebKit 默认点击高亮（高亮层忽略 `border-radius`，圆角元素会出现方角闪烁）：交互元素加 `WebkitTapHighlightColor: "transparent"`（或 Tailwind `[-webkit-tap-highlight-color:transparent]`）。详见 `big-question/webkit-tap-highlight.md`。
- 触摸目标不小于 44×44px。
- 自定义滚动区防下拉刷新：`overscroll-contain` + `touchAction: "pan-y"`。

## 响应式

移动优先，自小屏向上加断点：`p-4 md:p-6 lg:p-8`。

## 动画

尊重 `prefers-reduced-motion`：`motion-reduce:transition-none`、`motion-reduce:hover:scale-100`。项目用 `motion`（ex framer-motion）做较复杂动画。

## dev / prod 差异

Turbopack（dev）与 Webpack（prod）对 CSS 处理有细微差异（class 顺序、purge）。布局改完**务必同时验证** `pnpm dev` 与 `pnpm build && pnpm start`，尤其 flexbox 行为。详见 `big-question/turbopack-webpack-flexbox.md`。
