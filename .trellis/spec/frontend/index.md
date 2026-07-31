# 前端规范（frontend）

> 适用于 `src/` 下前端代码。权威源：`src/AGENTS.md` 及 `src/shared/hooks/AGENTS.md`、`src/shared/lib/AGENTS.md`。

## 技术栈

- Next.js 16 App Router + React 19，TypeScript strict
- 数据请求：**TanStack Query + oRPC client**（非 SWR）
- 表单：react-hook-form + zodResolver
- 状态：useState / props / Context / zustand 按作用范围选
- 样式：Tailwind v4，组件优先用 shadcn（`src/shared/ui`）
- hooks 工具库：react-use（经 `@/shared/hooks` barrel）

## 文档索引

| 文件 | 内容 | 优先级 |
| --- | --- | --- |
| [directory-structure.md](./directory-structure.md) | FSD 分层、segment、公有 API、导入边界 | **必读** |
| [components.md](./components.md) | shadcn 用法、Icons 注册、Loading/滚动条分工、SSR 安全、排版/文案 | **必读** |
| [orpc-usage.md](./orpc-usage.md) | oRPC client + TanStack Query 用法、queryKey 失效、infinite | **必读** |
| [data-fetching.md](./data-fetching.md) | 旧 SWR 规则（已废弃，待清理）| 参考 |
| [state-management.md](./state-management.md) | useState/props/Context/zustand 选型、Context 编写要求 | **必读** |
| [forms.md](./forms.md) | react-hook-form + zodResolver + next-safe-action | 参考 |
| [toast-and-feedback.md](./toast-and-feedback.md) | `@/features/toast` barrel、禁业务直接 sonner | 参考 |
| [hooks.md](./hooks.md) | react-use barrel、自实现 hook 规范 | 参考 |
| [css-layout.md](./css-layout.md) | flexbox/items-stretch/min-h-0、Tailwind v4 简写、tap-highlight | 参考 |
| [type-safety.md](./type-safety.md) | 类型从 Dto/Vo 派生 | 参考 |
| [quality.md](./quality.md) | 提交前清单 | 参考 |

## 核心规则速查

| 规则 | 出处 |
| --- | --- |
| FSD 分层只能向下依赖，slice 经 `index.ts` 公有 API 导入 | directory-structure.md |
| shadcn 组件放 `shared/ui`，用前先查是否已有 | components.md |
| 滚动默认 `scrollbar-thin`；仅自绘滚动条控件时用 `ScrollArea`，禁止叠用 | components.md |
| 图标在 `icons.tsx` 统一注册后用 `Icons.xxx`，业务代码禁直接 import `@tabler/icons-react` | components.md |
| 数据请求用 `orpc.xxx.queryOptions()` + `useQuery`，不重复写失败 toast | orpc-usage.md |
| 缓存失效用 `qc.invalidateQueries({ queryKey: xxxKeys.all })`，不用 Context 传 mutate | orpc-usage.md |
| toast 只从 `@/features/toast` 导入 | toast-and-feedback.md |
| Context 必须含 `ContextType` + Provider + `useXxxContext`（缺失 Provider 抛错） | state-management.md |
| React 组件用 `function` 声明，Hook/普通函数用 `const` 箭头 | shared/code-quality.md |
