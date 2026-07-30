# 组件规范

> 权威源：`src/AGENTS.md`。React 组件用 `function` 声明；Hook、普通函数用 `const` 箭头。

## shadcn 组件

- 优先使用 shadcn 组件，统一放 **`src/shared/ui`**。用前先查 `shared/ui` 是否已有可复用实现。
- 安装新组件：`npx shadcn@latest add <组件>`（**必须用 `npx`，不要 `pnpm dlx`**——本地 pnpm 装的 shadcn 旧版有 zod 冲突 bug；详见根 `AGENTS.md`）。
- 不确定组件 API/组合方式时调用 `/shadcn` 技能。
- shadcn 原生 sonner 包装组件在 `src/shared/ui/sonner.tsx`（shadcn 生成），与业务 toast 封装 `src/features/toast` 不同，业务用后者。

## 图标（Icons）

- 图标统一维护在 `src/shared/ui/icons.tsx`，业务通过 `Icons.xxx` 使用：

```tsx
// 注册（按业务语义命名，不用图标库原名）
import { IconRobot } from "@tabler/icons-react";
export const Icons = { logo: IconRobot, specCreate: ..., helpCenter: ... };

// 使用
import { Icons } from "@/shared/ui/icons";
<Icons.logo className="size-4" />
```

- **业务代码禁止直接 `import { IconXxx } from "@tabler/icons-react"`**，也禁止组件内临时定义图标或内联 SVG。
- 例外：`icons.tsx` 注册表本身、以及"以 DB key 映射图标"的配置型数据（如 `src/features/rule-space-combobox/config/space-icons.ts`，存 key 渲染时映射）属于合法的直接依赖。
- 新增图标按业务语义命名（`specCreate` 而非 `IconPlus`），按语义分组放置。

## SVG 资源

- 少量自定义 SVG 放 `shared/assets/icons`。不在应用代码内联 SVG，不放到其他目录。新增/修改 SVG 前用 SVGO 优化。

## Loading 组件（按场景分工，不可混用）

| 组件 | 路径 | 适用场景 | 尺寸控制 |
| --- | --- | --- | --- |
| `Spinner` | `@/shared/ui/spinner` | **嵌入式**：按钮、输入框、行内文字旁（loading 和文字/图标挤在一起） | `className` 的 `size-*` |
| `ScaleLoaderWrap` | `@/shared/ui/scale-loader` | **独立加载区**：居中、有留白的整块占位（首次加载、无限滚动、区域/全屏遮罩、Suspense fallback） | `height`/`width`/`barCount` props |

判断关键：loading 是该区域**唯一内容**（→ `ScaleLoaderWrap`），还是和内容**挤在一起**（→ `Spinner`）。两者尺寸 API 不互通。

- `ScaleLoaderWrap` 颜色靠 `currentColor`，**调用处外层加 `text-muted-foreground`** 控色；默认值 `height=35,width=4,barCount=5`，紧凑场景按比例缩小（`height={24} width={3}`）。
- 列表整块用假数据模拟布局的骨架占位用 `Skeleton`，不在此列。

## 滚动条（按场景分工，不可混用）

| 方案 | 用法 | 适用 |
| --- | --- | --- |
| `scrollbar-thin` | `overflow-auto scrollbar-thin` | **默认**：布局溢出、表格、textarea、长文、普通面板 |
| `ScrollArea` | `@/shared/ui/scroll-area` | **例外**：固定高度产品面板，且滚动条需自绘（跨浏览器一致 / scroll 态显隐 / `viewportRef` / `thumbSmooth`） |

- **默认 CSS**；仅当滚动条是该模块设计控件时用 `ScrollArea`。
- 显隐、变细 **不是** 用 `ScrollArea` 的充分条件（`scrollbar-thin` 已覆盖 hover 细条）。
- 同一滚动容器禁止叠用两套。
- 操作滚动：原生挂 `ref`；`ScrollArea` 必须 `viewportRef`（Root 不滚动）。
- `ScrollArea` 要滚动须带 `max-h-*`（Viewport 只读 `max-height`）；仅 `h-full` 会撑成内容高度。
- `thumbSmooth` 仅内容高度突变时短暂开启，禁止常开。
- `ScrollMask` 与选型正交：先定滚动方案，再叠 mask。

## SSR / Hydration 安全

- 整块 UI 只在客户端渲染 → `ClientOnly`（`@/shared/ui/client-only`）
- 组件内部个别变量需 SSR/客户端区分 → `useMounted`（`@/shared/hooks`）
- 浏览器 API（`localStorage`/`window`/`document.cookie`）在 `useEffect` 或回调中访问 → 无需额外处理

## 排版规范

统一用 Tailwind `text-*`，不自建字号档位。

| 场景 | 字号 | 字重 |
| --- | --- | --- |
| 特殊大号 | `text-3xl`（30px） | 视情况 |
| 页面主标题 | `text-xl`（20px） | `font-semibold` |
| 区块/卡片标题 | `text-lg`（18px） | `font-semibold` |
| 正文 | `text-sm`（14px） | — |
| 辅助文字 | `text-xs`（12px） | — |

## 文案规范（对话式 + 简洁 + 功能性）

- 用"你"对话，语气亲切，可用语气词（"吧"、"哦"）。
- 一句话说清目的，不复述字段名、不暴露实现（"自动选中"、"落库"等）。

```ts
// ❌ 复述字段、暴露实现
"输入文件夹名称、描述和颜色，创建后会自动选中。"
// ✅
"创建一个属于你的文件夹吧，取个好记的名字和颜色。"
```

## Server / Client 组件

- 默认 Server Component；需要事件处理、`useState`/`useEffect`、浏览器 API 时才加 `"use client"`。
- 把交互部分下沉到 Client Component，顶层尽量保持 Server Component。
- Server → Client 传 props 必须可序列化（无 `Date` 对象/函数/`Map`/`Set`/类实例；`Date` 先 `toISOString()`）。
