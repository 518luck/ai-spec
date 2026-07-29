# 前端提交前清单

提交前端代码前逐项核对。

## 类型与质量

- [ ] `pnpm run typecheck` 无错误（不直接跑 tsc）
- [ ] `pnpm run lint` 无错误
- [ ] 无 `any` / `!` / `@ts-ignore` / `@ts-expect-error`
- [ ] 接口类型从 Dto/Vo schema 派生，未手写重复
- [ ] 无 `console.log` 残留（临时调试除外）

## 目录与组件

- [ ] 新代码放对 FSD layer（app/pages/widgets/features/entities/shared）
- [ ] 跨 slice 经 `index.ts` 公有 API 导入，无深层导入
- [ ] React 组件用 `function` 声明，Hook/普通函数用 `const` 箭头
- [ ] 语义化 HTML（可点击用 `<button>`/`<Link>`，不用 `<div onClick>`）
- [ ] Server Component 优先，仅在需要交互/hooks/浏览器 API 时加 `"use client"`

## UI 约定

- [ ] 先查 `shared/ui` 是否已有可复用 shadcn 组件
- [ ] 图标经 `Icons.xxx` 使用，未在业务代码直接 import `@tabler/icons-react`
- [ ] Loading 按场景选 `Spinner`（嵌入式）或 `ScaleLoaderWrap`（独立加载区）
- [ ] 排版用 Tailwind `text-*` 标准档位

## 数据与状态

- [ ] 数据请求用 `useSWR`，未自写失败 toast（全局 onError 已处理）
- [ ] toast 从 `@/features/toast` 导入
- [ ] 服务端数据未放入 Context / zustand
- [ ] Context 含 `ContextType` + Provider + `useXxxContext`（缺失抛错）

## 布局与跨端

- [ ] 主 flex 容器 `items-stretch`；可滚动子元素 `min-h-0`
- [ ] 圆角交互元素处理了 tap-highlight
- [ ] 同时在 `pnpm dev` 与 `pnpm build && pnpm start` 验证过布局
