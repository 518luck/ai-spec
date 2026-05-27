# 前端开发指南

## 适用范围

本指南适用于前端相关代码

注意：`shared/` 目录下的代码不一定都是前端代码，也可能包含后端共享逻辑。修改 `shared/` 下的文件时，先确认该文件的实际用途和调用方，不要默认按前端代码处理。

shared/lib 下面前后端混合
shared/db : 这个是脚本生成的代码,严禁修改

## 前端结构规范（FSD）

本项目前端业务代码位于 `src/`，按 Feature-Sliced Design 组织。根目录 `app/` 是 Next.js App Router 路由层，不是 FSD 的 `src/app`。除 `app/api/**` 外，根 `app/**` 应保持薄层，只放 `page.tsx`、`layout.tsx`、`metadata`、`loading.tsx`、`error.tsx` 等框架入口，并把业务实现委托给 `src/`。

### 放置规则

| 场景                               | 放置位置                  |
| ---------------------------------- | ------------------------- |
| 应用启动、全局 providers、全局样式 | `src/app/`                |
| 路由对应的完整页面内容             | `src/pages/<page>/`       |
| 可复用的大型页面区块               | `src/widgets/<widget>/`   |
| 用户可感知的业务动作               | `src/features/<feature>/` |
| 业务实体、实体展示、实体模型       | `src/entities/<entity>/`  |
| 与业务无关的通用能力               | `src/shared/<segment>/`   |

### Slice 与 Segment

- `pages`、`widgets`、`features`、`entities` 下必须先建 slice，再建 segment，例如 `src/features/create-spec/ui/create-spec-form.tsx`。
- `src/app` 和 `src/shared` 不拆 slice，直接按 segment 组织。
- 常用 segment 为 `ui`、`model`、`api`、`lib`、`config`。
- 不要新建 `components`、`hooks`、`types` 这类只描述技术形态的顶层 segment，优先归入 `ui`、`model`、`api`、`lib`。

### 导入边界

Layer 只能向下依赖：

```txt
src/app
→ src/pages
→ src/widgets
→ src/features
→ src/entities
→ src/shared
```

- features 可以导入 entities 和 shared，不能导入 widgets、pages、src/app。
- entities 只能导入 shared。
- shared 不能导入任何业务 layer。
- 同一 layer 的不同 slice 默认不能互相导入。
- 如果需要组合多个同层 slice，应放到更高 layer，例如在 widgets 组合多个 features。

### 每个 slice 必须提供 index.ts 作为公有 API。

```typescript
// 正确
import { CreateSpecForm } from "@/features/create-spec";

// 禁止：跨 slice 深层导入
import { CreateSpecForm } from "@/features/create-spec/ui/create-spec-form";
```

- index.ts 只导出外部真正需要使用的组件、函数和类型。
- 禁止在 slice 公有 API 中使用 `export \*` 无差别导出。
- slice 内部文件互相引用时使用相对路径。
- 不要从本 slice 的 index.ts 再导入本 slice 内部成员。

### 禁止事项

- 禁止低层导入高层。
- 禁止同层不同 slice 互相导入。
- 禁止绕过公有 API 深层导入其他 slice 内部文件。
- 禁止把具体业务逻辑放进 shared。
- 禁止把只用一次的页面局部 UI 过早抽到 widgets 或 features。

## UI 组件

优先使用 shadcn 组件进行开发。

项目内的 shadcn 组件统一放在 `shared/ui` 目录下。使用组件前，先检查 `shared/ui` 中是否已有可复用实现。

如果 shadcn 官方提供了某个组件，但本地尚未安装，可以使用：

```bash
pnpm dlx shadcn@latest add [组件名]
```

使用 shadcn 组件时，如果不确定组件 API、组合方式或最佳实践，应调用 /shadcn 技能查看正确用法。

## 图标

大部分图标统一维护在 src/shared/ui/icons.tsx 中。

默认使用 @tabler/icons-react 提供的图标。不要在业务代码中直接从图标库导入图标，也不要在组件内临时定义图标；应先在 icons.tsx 中统一注册，再通过 Icons 对象使用。

### 正确示例

添加图标：

```typescript
import { IconRobot } from "@tabler/icons-react";

export const Icons = {
  logo: IconRobot,
};
```

使用的时候：

```typescript
import { Icons } from "@/shared/ui/icons";

<Icons.logo className="size-4" />
```

### 错误示例

不要在业务组件中直接从 @tabler/icons-react 导入图标：

```typescript
import { IconRobot } from "@tabler/icons-react";

export function Header() {
  return <IconRobot className="size-4" />;
}
```

不要在组件中内联 SVG：

```typescript
export function HeaderLogo() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="..." />
    </svg>
  );
}
```

新增图标时，应保持命名简洁、语义明确，并按语义分组放置。

## SVG 资源

少量自定义 SVG 图标存放在 shared/assets/icons 目录下。

不要在应用代码中内联 SVG，也不要将 SVG 图标放到其他目录。新增或修改 SVG 文件前，应使 SVGO 进行优化。
