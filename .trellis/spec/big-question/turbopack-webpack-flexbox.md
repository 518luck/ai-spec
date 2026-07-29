# Turbopack vs Webpack 的 Flexbox 差异

## 问题

布局在 dev（Turbopack）正常，prod（Webpack）却错位：flex 容器与子元素行为不一致、可滚动区失效、嵌套 flex 表现不同。

## 根因

Turbopack（Next.js dev 默认）与 Webpack（生产构建）处理 CSS 有细微差异，尤其在 flexbox：

1. Turbopack 对显式 flexbox 属性更严格。
2. Webpack 可能自动推断某些 flex 子行为，Turbopack 不会。
3. 差异在 CSS 编译/应用方式，不在 CSS 规范本身。

## 解决

### 1. 显式 `items-stretch`

主 flex 容器需要子元素填满高度时，显式写 `items-stretch`（默认值，但跨打包器更稳）：

```tsx
<div className="flex h-screen flex-col items-stretch">
  <main className="flex flex-1 items-stretch">{/* ... */}</main>
</div>
```

### 2. 父子职责分离

- **父**：定义 flex 容器（`flex`/`flex-col`/`flex-row`）、对齐（`items-stretch`/`justify-between`）、整体尺寸（`h-screen`/`w-full`）。
- **子**：定义自身 flex 行为（`flex-1`/`flex-shrink-0`）、内部 overflow（`overflow-auto`）、min/max 约束（`min-h-0`/`min-w-0`）。

### 3. 可滚动 flex 子用 `min-h-0`

flex 子默认 `min-height: auto` 会阻止 overflow；需内部滚动加 `min-h-0`：

```tsx
<div className="flex h-full flex-col items-stretch">
  <div className="shrink-0">固定头部</div>
  <div className="min-h-0 flex-1 overflow-auto">{/* 滚动内容 */}</div>
</div>
```

### 完整布局范例

```tsx
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col items-stretch">
      <nav className="h-16 shrink-0 border-b"><Navigation /></nav>
      <div className="flex min-h-0 flex-1 items-stretch">
        <aside className="w-64 shrink-0 overflow-auto border-r"><Sidebar /></aside>
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

## 要点

1. **务必同时验证 dev 与 prod**：`pnpm dev` 与 `pnpm build && pnpm start`。
2. flexbox 属性写显式，别依赖浏览器/打包器默认推断。
3. 需子元素填满高度的容器显式 `items-stretch`。
4. 可滚动 flex 子记得 `min-h-0` / `min-w-0`。
5. 父子职责分离，文档化布局模式保证团队一致。
