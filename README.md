# Prompt Shelf

一个基于 Next.js App Router 的 FSD 起始项目。

## 结构思路

- 根目录 `app/` 只放 Next.js 特殊文件，比如 `layout.tsx` 和 `page.tsx`
- 真正的应用实现放在 `src/`
- `src/app` 负责应用壳、providers、全局样式
- `src/pages` 负责页面 slice
- `src/widgets` 和 `src/shared` 负责复用 UI
- 根目录 `pages/` 保持存在但不承载实际页面

## 当前示例

- `app/page.tsx` 只是首页路由入口
- `src/pages/home` 是首页 page slice
- `src/widgets/home-hero` 是首页展示 widget
- `src/shared/ui/info-tile.tsx` 是共享展示组件

## 运行

```bash
pnpm dev
pnpm lint
```
