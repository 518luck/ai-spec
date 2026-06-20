# Next.js 路由层规范

## 适用范围

本文件适用于 `app/**` 下的 Next.js App Router 路由文件。

例外：

- `app/api/**` 是后端入口，遵循 `app/api/AGENTS.md`。
- 除 `app/api/**` 外，`app/**` 都视为前端路由层。

## 路由层职责

`app/**` 只承接 Next.js 路由能力，不承载前端业务实现。

允许放置：

- `page.tsx`
- `layout.tsx`
- `loading.tsx`
- `error.tsx`
- `not-found.tsx`
- `route.ts`
- `metadata`
- 少量 Next.js 框架 glue code

禁止放置：

- 页面主体业务 UI
- 复杂业务逻辑
- 可复用业务组件
- 前端状态管理
- API 请求封装
- 实体模型、schema、业务类型

## 页面入口规则

`app/**/page.tsx` 应保持薄层，只导入或 re-export `src/pages` 中的页面实现。

```tsx
// app/spec/[id]/page.tsx
export { SpecPage as default, metadata } from "@/pages/spec";
```

## 页面主体应放在：

- `src/pages/<page>/ui/`

## 组件放置判断

- 页面专属且不复用的小组件，留在对应 `src/pages/<page>/ slice` 内。
- 被多个页面复用的大块 UI，上移到 `src/widgets/<widget>/`。
- 被多个页面或区块复用的用户动作，上移到 `src/features/<feature>/`。
- 与业务实体相关的通用展示、类型、模型，放到 `src/entities/<entity>/`。
- 与业务无关的通用能力，放到 `src/shared/`。

## 导入规则

- 路由层只能向 `src/` 导入页面或必要的应用入口能力。

```typescript
// good
import { SpecPage } from "@/pages/spec";

// bad
import { SpecEditor } from "@/widgets/spec-editor";
import { PublishSpecButton } from "@/features/publish-spec";
import { SpecCard } from "@/entities/spec";
```

如果 `app/**` 需要直接组合 widgets/features/entities，优先把组合逻辑下沉到 `src/pages/<page>/`。

## 禁止事项

- 禁止把页面主体直接写在 `app/**/page.tsx`。
- 禁止在 `app/**` 中实现复杂业务逻辑。
- 禁止在 `app/**` 中创建前端业务组件目录。
- 禁止绕过 `src/pages` 直接在路由层拼装复杂页面。
- 禁止把 `app/api/**` 当作前端 FSD 目录使用。
