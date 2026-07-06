---
name: shadcn
description: 管理 shadcn 组件和项目，包括添加、搜索、修复、调试、样式设置和组合 UI。提供项目上下文、组件文档和使用示例。适用于处理 shadcn/ui、组件注册表、预设、--preset 代码，或任何包含 components.json 文件的项目。也会在执行 "shadcn init"、"create an app with --preset" 或 "switch to --preset" 时触发。
user-invocable: false
allowed-tools: Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *)
---

# shadcn/ui

一个用于构建 UI、组件和设计系统的框架。组件会通过 CLI 以源代码形式添加到用户项目中。

> **重要：** 所有 CLI 命令都必须使用项目的包运行器执行：`npx shadcn@latest`、`pnpm dlx shadcn@latest` 或 `bunx --bun shadcn@latest`，具体取决于项目的 `packageManager`。下面示例使用 `npx shadcn@latest`，但应替换为项目对应的正确运行器。

## 当前项目上下文

```json
!`npx shadcn@latest info --json`
```

上面的 JSON 包含项目配置和已安装组件。使用 `npx shadcn@latest docs <component>` 可以获取任意组件的文档和示例 URL。

## 原则

1. **优先使用现有组件。** 编写自定义 UI 之前，先用 `npx shadcn@latest search` 检查注册表。也要检查社区注册表。
2. **组合，而不是重新发明。** 设置页 = Tabs + Card + 表单控件。Dashboard = Sidebar + Card + Chart + Table。
3. **自定义样式前先使用内置 variants。** `variant="outline"`、`size="sm"` 等。
4. **使用语义化颜色。** `bg-primary`、`text-muted-foreground`，绝不要使用 `bg-blue-500` 这类原始值。

## 关键规则

这些规则**始终强制执行**。每条规则都链接到一个包含错误/正确代码对照的文件。

### 样式与 Tailwind → [styling.md](./rules/styling.md)

- **`className` 用于布局，不用于样式。** 绝不要覆盖组件颜色或排版。
- **不要使用 `space-x-*` 或 `space-y-*`。** 使用带 `gap-*` 的 `flex`。对于垂直堆叠，使用 `flex flex-col gap-*`。
- **宽高相等时使用 `size-*`。** 使用 `size-10`，不要使用 `w-10 h-10`。
- **使用 `truncate` 简写。** 不要使用 `overflow-hidden text-ellipsis whitespace-nowrap`。
- **不要手动使用 `dark:` 覆盖颜色。** 使用语义化 tokens（`bg-background`、`text-muted-foreground`）。
- **使用 `cn()` 处理条件 class。** 不要手写模板字符串三元表达式。
- **不要在 overlay 组件上手动设置 `z-index`。** Dialog、Sheet、Popover 等会自行处理层叠关系。

### 表单与输入 → [forms.md](./rules/forms.md)

- **表单使用 `FieldGroup` + `Field`。** 绝不要使用带 `space-y-*` 或 `grid gap-*` 的原始 `div` 做表单布局。
- **`InputGroup` 使用 `InputGroupInput`/`InputGroupTextarea`。** 绝不要在 `InputGroup` 中直接使用原始 `Input`/`Textarea`。
- **输入中的按钮使用 `InputGroup` + `InputGroupAddon`。**
- **选项组（2-7 个选项）使用 `ToggleGroup`。** 不要循环渲染带手动激活状态的 `Button`。
- **使用 `FieldSet` + `FieldLegend` 分组相关 checkbox/radio。** 不要使用带标题的 `div`。
- **字段校验使用 `data-invalid` + `aria-invalid`。** `Field` 上使用 `data-invalid`，控件上使用 `aria-invalid`。对于禁用状态：`Field` 上使用 `data-disabled`，控件上使用 `disabled`。

### 组件结构 → [composition.md](./rules/composition.md)

- **Item 始终放在其 Group 内。** `SelectItem` → `SelectGroup`。`DropdownMenuItem` → `DropdownMenuGroup`。`CommandItem` → `CommandGroup`。
- **自定义 trigger 使用 `asChild`（radix）或 `render`（base）。** 通过 `npx shadcn@latest info` 检查 `base` 字段。→ [base-vs-radix.md](./rules/base-vs-radix.md)
- **Dialog、Sheet 和 Drawer 始终需要 Title。** 为保证可访问性，必须提供 `DialogTitle`、`SheetTitle`、`DrawerTitle`。如果视觉上隐藏，使用 `className="sr-only"`。
- **使用完整 Card 组合。** `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`。不要把所有内容都堆进 `CardContent`。
- **Button 没有 `isPending`/`isLoading`。** 使用 `Spinner` + `data-icon` + `disabled` 组合实现。
- **`TabsTrigger` 必须在 `TabsList` 内。** 绝不要直接在 `Tabs` 中渲染 trigger。
- **`Avatar` 始终需要 `AvatarFallback`。** 用于图片加载失败时展示。

### 使用组件，而不是自定义标记 → [composition.md](./rules/composition.md)

- **自定义标记前先使用现有组件。** 写带样式的 `div` 之前，先检查是否已有组件。
- **Callout 使用 `Alert`。** 不要构建自定义样式 div。
- **空状态使用 `Empty`。** 不要构建自定义空状态标记。
- **Toast 使用 `sonner`。** 使用来自 `sonner` 的 `toast()`。
- **使用 `Separator`** 替代 `<hr>` 或 `<div className="border-t">`。
- **使用 `Skeleton`** 作为加载占位。不要使用自定义 `animate-pulse` div。
- **使用 `Badge`** 替代自定义样式 span。

### 图标 → [icons.md](./rules/icons.md)

- **`Button` 中的图标使用 `data-icon`。** 在图标上使用 `data-icon="inline-start"` 或 `data-icon="inline-end"`。
- **组件内部图标不要添加尺寸 class。** 组件会通过 CSS 处理图标尺寸。不要使用 `size-4` 或 `w-4 h-4`。
- **以对象形式传递图标，不要传字符串键。** 使用 `icon={CheckIcon}`，不要使用字符串查找。

### CLI

- **绝不要手动解码 preset codes 或手动构建 preset URL。** 使用 `npx shadcn@latest preset decode <code>`、`preset url <code>` 或 `preset open <code>`。对于基于项目的 preset 检测，使用 `npx shadcn@latest preset resolve`。
- **直接用 CLI 应用 preset codes。** 对现有项目使用 `npx shadcn@latest apply <code>`，初始化时使用 `npx shadcn@latest init --preset <code>`。

## 关键模式

这些是区分正确 shadcn/ui 代码时最常见的模式。边界情况请查看上面链接的规则文件。

```tsx
// Form layout: FieldGroup + Field, not div + Label.
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" />
  </Field>
</FieldGroup>

// Validation: data-invalid on Field, aria-invalid on the control.
<Field data-invalid>
  <FieldLabel>Email</FieldLabel>
  <Input aria-invalid />
  <FieldDescription>Invalid email.</FieldDescription>
</Field>

// Icons in buttons: data-icon, no sizing classes.
<Button>
  <SearchIcon data-icon="inline-start" />
  Search
</Button>

// Spacing: gap-*, not space-y-*.
<div className="flex flex-col gap-4">  // correct
<div className="space-y-4">           // wrong

// Equal dimensions: size-*, not w-* h-*.
<Avatar className="size-10">   // correct
<Avatar className="w-10 h-10"> // wrong

// Status colors: Badge variants or semantic tokens, not raw colors.
<Badge variant="secondary">+20.1%</Badge>    // correct
<span className="text-emerald-600">+20.1%</span> // wrong
```

## 组件选择

| 需求                  | 使用                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| 按钮/操作             | 使用合适 variant 的 `Button`                                                                        |
| 表单输入              | `Input`, `Select`, `Combobox`, `Switch`, `Checkbox`, `RadioGroup`, `Textarea`, `InputOTP`, `Slider` |
| 在 2-5 个选项之间切换 | `ToggleGroup` + `ToggleGroupItem`                                                                   |
| 数据展示              | `Table`, `Card`, `Badge`, `Avatar`                                                                  |
| 导航                  | `Sidebar`, `NavigationMenu`, `Breadcrumb`, `Tabs`, `Pagination`                                     |
| Overlay               | `Dialog`（modal）, `Sheet`（侧边面板）, `Drawer`（底部抽屉）, `AlertDialog`（确认）                 |
| 反馈                  | `sonner`（toast）, `Alert`, `Progress`, `Skeleton`, `Spinner`                                       |
| 命令面板              | `Dialog` 内的 `Command`                                                                             |
| 图表                  | `Chart`（封装 Recharts）                                                                            |
| 布局                  | `Card`, `Separator`, `Resizable`, `ScrollArea`, `Accordion`, `Collapsible`                          |
| 空状态                | `Empty`                                                                                             |
| 菜单                  | `DropdownMenu`, `ContextMenu`, `Menubar`                                                            |
| Tooltip/信息提示      | `Tooltip`, `HoverCard`, `Popover`                                                                   |

## 关键字段

注入的项目上下文包含以下关键字段：

- **`aliases`** → 使用真实的导入 alias 前缀（例如 `@/`、`~/`），绝不要硬编码。
- **`isRSC`** → 当值为 `true` 时，使用 `useState`、`useEffect`、事件处理器或浏览器 API 的组件需要在文件顶部添加 `"use client"`。建议是否添加该指令时，始终参考此字段。
- **`tailwindVersion`** → `"v4"` 使用 `@theme inline` 块；`"v3"` 使用 `tailwind.config.js`。
- **`tailwindCssFile`** → 定义自定义 CSS 变量的全局 CSS 文件。始终编辑此文件，绝不要创建新文件。
- **`style`** → 组件视觉风格（例如 `nova`、`vega`）。
- **`base`** → primitive 库（`radix` 或 `base`）。影响组件 API 和可用 props。
- **`iconLibrary`** → 决定图标导入。`lucide` 使用 `lucide-react`，`tabler` 使用 `@tabler/icons-react` 等。绝不要假定使用 `lucide-react`。
- **`resolvedPaths`** → 组件、utils、hooks 等的精确文件系统目标位置。
- **`framework`** → 路由和文件约定（例如 Next.js App Router 与 Vite SPA）。
- **`packageManager`** → 安装任何非 shadcn 依赖时使用此字段（例如 `pnpm add date-fns` 与 `npm install date-fns`）。
- **`preset`** → 当前项目解析后的 preset code 和值。只需要 preset 信息时，使用 `npx shadcn@latest preset resolve --json`。

完整字段参考见 [cli.md — `info` 命令](./cli.md)。

## 组件文档、示例和用法

运行 `npx shadcn@latest docs <component>` 获取组件文档、示例和 API 参考的 URL。抓取这些 URL 可获得实际内容。

```bash
npx shadcn@latest docs button dialog select
```

**创建、修复、调试或使用组件时，始终先运行 `npx shadcn@latest docs` 并抓取 URL。** 这能确保你基于正确的 API 和使用模式工作，而不是猜测。

## 工作流程

1. **获取项目上下文** — 上面已经注入。如需刷新，再次运行 `npx shadcn@latest info`。
2. **先检查已安装组件** — 运行 `add` 前，始终检查项目上下文中的 `components` 列表，或列出 `resolvedPaths.ui` 目录。不要导入尚未添加的组件，也不要重新添加已安装的组件。
3. **查找组件** — `npx shadcn@latest search`。
4. **获取文档和示例** — 运行 `npx shadcn@latest docs <component>` 获取 URL，然后抓取它们。使用 `npx shadcn@latest view` 浏览尚未安装的 registry item。要预览已安装组件的变更，使用 `npx shadcn@latest add --diff`。
5. **安装或更新** — `npx shadcn@latest add`。更新现有组件时，先使用 `--dry-run` 和 `--diff` 预览变更（见下方[更新组件](#更新组件)）。
6. **修复第三方组件中的导入** — 从社区注册表添加组件后（例如 `@bundui`、`@magicui`），检查新增的非 UI 文件中是否存在类似 `@/components/ui/...` 的硬编码导入路径。这些路径不会匹配项目实际 alias。使用 `npx shadcn@latest info` 获取正确的 `ui` alias（例如 `@workspace/ui/components`），并相应重写导入。CLI 会重写自带 UI 文件的导入，但第三方注册表组件可能使用与项目不匹配的默认路径。
7. **审查新增组件** — 从任意注册表添加组件或 block 后，**始终读取新增文件并验证其正确性**。检查缺失的子组件（例如没有 `SelectGroup` 的 `SelectItem`）、缺失导入、错误组合，或违反[关键规则](#关键规则)的问题。同时将任何图标导入替换为项目上下文中的 `iconLibrary`（例如 registry item 使用 `lucide-react` 但项目使用 `hugeicons`，则相应替换导入和图标名称）。继续前修复所有问题。
8. **必须明确注册表** — 当用户要求添加 block 或组件时，**不要猜测注册表**。如果没有指定注册表（例如用户说“add a login block”但没有指定 `@shadcn`、`@tailark` 等），询问使用哪个注册表。绝不要替用户默认选择注册表。
9. **切换 presets** — 先询问用户：**overwrite**、**partial**、**merge** 还是 **skip**？
   - **检查当前 preset**：`npx shadcn@latest preset resolve`。需要结构化值时使用 `--json`。
   - **检查传入 preset**：`npx shadcn@latest preset decode <code>`。使用 `preset url <code>` 或 `preset open <code>` 分享或打开 preset builder。
   - **Overwrite**：`npx shadcn@latest apply <code>`。覆盖检测到的组件、字体和 CSS 变量。
   - **Partial**：`npx shadcn@latest apply <code> --only theme,font`。只更新选定的 preset 部分，不重新安装 UI 组件。支持值为 `theme` 和 `font`；允许逗号分隔组合。`icon` 被有意排除，因为图标变更可能需要完整组件重装和转换。
   - **Merge**：`npx shadcn@latest init --preset <code> --force --no-reinstall`，然后运行 `npx shadcn@latest info` 列出已安装组件，再对每个已安装组件使用 `--dry-run` 和 `--diff` 逐个[智能合并](#更新组件)。
   - **Skip**：`npx shadcn@latest init --preset <code> --force --no-reinstall`。只更新配置和 CSS，保持组件不变。
   - **重要**：始终在用户项目目录内运行 preset 命令。`apply` 只适用于包含 `components.json` 文件的现有项目。CLI 会自动保留 `components.json` 中当前的 base（`base` 与 `radix`）。如果必须使用 scratch/temp 目录（例如用于 `--dry-run` 比较），请显式传入 `--base <current-base>`，preset codes 不会编码 base。

## 更新组件

当用户要求从 upstream 更新组件并保留其本地修改时，使用 `--dry-run` 和 `--diff` 进行智能合并。**绝不要手动从 GitHub 获取 raw files，始终使用 CLI。**

1. 运行 `npx shadcn@latest add <component> --dry-run` 查看会影响的所有文件。
2. 对每个文件，运行 `npx shadcn@latest add <component> --diff <file>` 查看 upstream 与本地的差异。
3. 根据 diff 逐个文件决策：
   - 无本地修改 → 可以安全覆盖。
   - 有本地修改 → 读取本地文件，分析 diff，并在保留本地修改的同时应用 upstream 更新。
   - 用户说“just update everything” → 使用 `--overwrite`，但必须先确认。
4. **没有用户明确批准，绝不要使用 `--overwrite`。**

## 快速参考

```bash
# Create a new project.
npx shadcn@latest init --name my-app --preset base-nova
npx shadcn@latest init --name my-app --preset a2r6bw --template vite

# Create a monorepo project.
npx shadcn@latest init --name my-app --preset base-nova --monorepo
npx shadcn@latest init --name my-app --preset base-nova --template next --monorepo

# Initialize existing project.
npx shadcn@latest init --preset base-nova
npx shadcn@latest init --defaults  # shortcut: --template=next --preset=nova (base style implied)

# Apply a preset to an existing project.
npx shadcn@latest apply a2r6bw
npx shadcn@latest apply a2r6bw --only theme
npx shadcn@latest apply a2r6bw --only font
npx shadcn@latest apply a2r6bw --only theme,font

# Inspect preset codes and project preset state.
npx shadcn@latest preset decode a2r6bw
npx shadcn@latest preset url a2r6bw
npx shadcn@latest preset open a2r6bw
npx shadcn@latest preset resolve
npx shadcn@latest preset resolve --json

# Add components.
npx shadcn@latest add button card dialog
npx shadcn@latest add @magicui/shimmer-button
npx shadcn@latest add --all

# Preview changes before adding/updating.
npx shadcn@latest add button --dry-run
npx shadcn@latest add button --diff button.tsx
npx shadcn@latest add @acme/form --view button.tsx

# Search registries.
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest search @tailark -q "stats"

# Get component docs and example URLs.
npx shadcn@latest docs button dialog select

# View registry item details (for items not yet installed).
npx shadcn@latest view @shadcn/button
```

**命名 presets：** `nova`、`vega`、`maia`、`lyra`、`mira`、`luma`
**Templates：** `next`、`vite`、`start`、`react-router`、`astro`（都支持 `--monorepo`）和 `laravel`（不支持 monorepo）
**Preset codes：** 带版本前缀的 base62 字符串（例如 `a2r6bw` 或 `b0`），来自 [ui.shadcn.com](https://ui.shadcn.com)。

## 详细参考

- [rules/forms.md](./rules/forms.md) — FieldGroup、Field、InputGroup、ToggleGroup、FieldSet、校验状态
- [rules/composition.md](./rules/composition.md) — Groups、overlays、Card、Tabs、Avatar、Alert、Empty、Toast、Separator、Skeleton、Badge、Button loading
- [rules/icons.md](./rules/icons.md) — data-icon、图标尺寸、以对象形式传递图标
- [rules/styling.md](./rules/styling.md) — 语义化颜色、variants、className、间距、size、truncate、dark mode、cn()、z-index
- [rules/base-vs-radix.md](./rules/base-vs-radix.md) — asChild 与 render、Select、ToggleGroup、Slider、Accordion
- [cli.md](./cli.md) — 命令、flags、presets、templates
- [customization.md](./customization.md) — 主题、CSS 变量、扩展组件
