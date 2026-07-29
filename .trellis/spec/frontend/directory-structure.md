# 前端目录结构（FSD）

> 权威源：`src/AGENTS.md`。根 `app/` 是 Next.js App Router 薄路由层，**不是** FSD 的 `src/app`。

## 分层

```txt
src/app      ← 应用启动：providers、全局样式
src/pages    ← 路由对应的完整页面
src/widgets  ← 可复用的大型页面区块（完整用例的复合 UI）
src/features ← 用户可感知的业务动作
src/entities ← 业务实体的建模（类型/常量/展示/请求）
src/shared   ← 与业务无关的通用能力
```

Layer 只能向下依赖：`app → pages → widgets → features → entities → shared`。

- features 可导入 entities / shared，不能导入 widgets / pages / app。
- entities 只能导入 shared。
- shared 不能导入任何业务 layer。
- 同 layer 不同 slice 默认不互相导入；要组合多个同层 slice，上浮到更高 layer（如在 widgets 组合多个 features）。

## 放置规则

| 场景 | 位置 |
| --- | --- |
| 应用启动、全局 providers、全局样式 | `src/app/` |
| 路由对应的完整页面内容 | `src/pages/<page>/` |
| 可复用的大型页面区块 | `src/widgets/<widget>/` |
| 用户可感知的业务动作 | `src/features/<feature>/` |
| 业务实体建模（类型/请求/展示） | `src/entities/<entity>/` |
| 与业务无关的通用能力 | `src/shared/<segment>/` |

## Slice 与 Segment

- `pages` / `widgets` / `features` / `entities` 下**先建 slice，再建 segment**：
  `src/features/create-spec/ui/create-spec-form.tsx`。
- `src/app` 和 `src/shared` **不拆 slice**，直接按 segment 组织。
- 常用 segment（按代码目的分组）：
  - `ui` — UI 显示：组件、样式、日期格式化
  - `model` — 数据模型：schema、类型、store、业务逻辑、Context
  - `api` — 请求与接口封装（entities 层主要是这个）
  - `lib` — 本 slice 复用工具
  - `config` — 配置、常量、feature flags
- **禁止**新建 `components` / `hooks` / `types` 这类只描述技术形态的顶层 segment，归入 `ui` / `model` / `api` / `lib`。

### pages 层 slice 规范

- 每条路由对应一个 page slice。URL 有共同前缀的路由建父文件夹归拢，父文件夹下每路由独立 slice（如 `pages/auth/login/`、`pages/auth/register/`）。
- slice 内文件**不重复 slice 名**（路径已标注）。
  - `ui/page.tsx`（页面组件通用名，组件名保留语义，由 `index.ts` 导出，如 → `LoginPage`）；其余组件按 UI 形态命名（`card.tsx`、`dialog.tsx`），同形态多个用形态前缀（`card-cluster.tsx`）。
  - `model/`：hook `use-xxx.ts`、schema `schema-xxx.ts`、类型 `types.ts`、Context `context-xxx.tsx`、纯函数 `helpers-xxx.ts`。
  - `lib/`、`config/`：按语义命名。

## 公有 API（index.ts）

- **每个 slice 必须提供 `index.ts` 作为公有 API**，只导出外部真正需要的成员。
- 跨 slice 一律经 `index.ts` 导入，**禁止深层导入**其他 slice 内部文件：

```ts
// ✅
import { CreateSpecForm } from "@/features/create-spec";
// ❌ 跨 slice 深层导入
import { CreateSpecForm } from "@/features/create-spec/ui/create-spec-form";
```

- 禁止在公有 API 用 `export *` 无差别导出。
- slice 内部互相引用用相对路径；不要从本 slice 的 `index.ts` 再导入本 slice 内部成员。

## 禁止事项

- 低层导入高层。
- 同层不同 slice 互相导入。
- 绕过公有 API 深层导入其他 slice 内部文件。
- 把具体业务逻辑放进 shared。
- 把只用一次的页面局部 UI 过早抽到 widgets / features。

## Next.js 路由层（app/）

`app/**`（不含 `app/api/**`）是薄路由层，只承接路由能力：

```tsx
// app/spec/[id]/page.tsx
export { SpecPage as default, metadata } from "@/pages/spec";
```

`page.tsx` 只 re-export `src/pages` 的页面，不写业务 UI。Next.js 约定文件（page/layout/loading/error/route）只放框架 glue code。
