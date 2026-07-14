# Next.js 路由层规范

`app/**` 是薄路由层，只承接路由能力；业务实现一律放 `src/`。
Next.js 约定文件（page/layout/loading/error/route 等）只放框架 glue code，不承载业务。

`page.tsx` 只 re-export `src/pages` 的页面，不写业务 UI：

```tsx
// app/spec/[id]/page.tsx
export { SpecPage as default, metadata } from "@/pages/spec";
```

页面主体放 `src/pages/<page>/`；组件按复用粒度上浮：`pages` → `widgets` → `features` → `entities` → `shared`。

例外：`app/api/**` 是后端入口，遵循 `app/api/AGENTS.md`。
