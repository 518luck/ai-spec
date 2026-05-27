# 前端开发指南

## 适用范围

本指南适用于前端相关代码

注意：`shared/` 目录下的代码不一定都是前端代码，也可能包含后端共享逻辑。修改 `shared/` 下的文件时，先确认该文件的实际用途和调用方，不要默认按前端代码处理。

shared/lib 下面前后端混合
shared/db : 这个是脚本生成的代码,严禁修改

## 结构

- src/app下面的前端代码遵循FSD结构
- 第一层目录为 Layers目录,顺序是 "app"、"pages"、"widgets"、"features"、"entities" 和 "shared"。
- 第二层目录为"Slices"，用领域划分，例如 "user"、"post" 和 "comment"。
- 第三层目录为"Segments" 分别标记为 "ui"、"model" 和 "api"。

> 注意
> Layers App 和 Shared 与其他 layers 不同，它们没有 slices，直接分为 segments。
> 然而，所有其他 layers — Entities、Features、Widgets 和 Pages，保持您必须首先创建 slices 的结构，在其中创建 segments。
> Layers 的技巧是一个 layer 上的模块只能了解并从严格位于下方的 layers 的模块中导入。

### slices

slices，它们按业务领域分割代码。您可以自由选择它们的名称，并根据需要创建任意数量。Slices 通过将逻辑相关的模块保持在一起，使您的代码库更容易导航。

Slices 不能使用同一 layer 上的其他 slices，这有助于实现高聚合性和低耦合性。

### segments

Slices 以及 layers App 和 Shared 由 segments 组成，segments 按代码的目的对代码进行分组。Segment 名称不受标准约束，但有几个最常见目的的传统名称：

- ui — 与 UI 显示相关的一切：UI 组件、日期格式化程序、样式等。
- api — 后端交互：请求函数、数据类型、mappers 等。
- model — 数据模型：schemas、interfaces、stores 和业务逻辑。
- lib — 此 slice 上其他模块需要的库代码。
- config — 配置文件和 feature flags。

> 通常这些 segments 对于大多数 layers 来说已经足够，您只会在 Shared 或 App 中创建自己的 segments，但这不是一个规则。

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
