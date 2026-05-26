# shadcn CLI 参考

配置从 `components.json` 读取。

> **重要：** 始终使用项目的包运行器执行命令：`npx shadcn@latest`、`pnpm dlx shadcn@latest` 或 `bunx --bun shadcn@latest`。检查项目上下文中的 `packageManager` 以选择正确的运行器。下面示例使用 `npx shadcn@latest`，但应替换为项目对应的正确运行器。

> **重要：** 只使用下面记录的 flags。不要发明或猜测 flags；如果这里没有列出某个 flag，它就不存在。CLI 会根据项目 lockfile 自动检测包管理器；不存在 `--package-manager` flag。

## 目录

- 命令：init、apply、add（dry-run、智能合并）、search、view、docs、info、build
- Templates：next、vite、start、react-router、astro
- Presets：命名形式、code、URL 格式和字段
- 切换 presets

---

## 命令

### `init` — 初始化或创建项目

```bash
npx shadcn@latest init [components...] [options]
```

在现有项目中初始化 shadcn/ui，或创建新项目（当提供 `--name` 时）。可选地在同一步安装组件。

| Flag | 简写 | 描述 | 默认值 |
| ----------------------- | ----- | --------------------------------------------------------- | ------- |
| `--template <template>` | `-t` | Template（next、start、vite、next-monorepo、react-router） | — |
| `--preset [name]` | `-p` | Preset 配置（命名形式、code 或 URL） | — |
| `--yes` | `-y` | 跳过确认提示 | `true` |
| `--defaults` | `-d` | 使用默认值（`--template=next --preset=base-nova`） | `false` |
| `--force` | `-f` | 强制覆盖现有配置 | `false` |
| `--cwd <cwd>` | `-c` | 工作目录 | current |
| `--name <name>` | `-n` | 新项目名称 | — |
| `--silent` | `-s` | 静默输出 | `false` |
| `--rtl` | | 启用 RTL 支持 | — |
| `--reinstall` | | 重新安装现有 UI 组件 | `false` |
| `--monorepo` | | 搭建 monorepo 项目 | — |
| `--no-monorepo` | | 跳过 monorepo 提示 | — |

`npx shadcn@latest create` 是 `npx shadcn@latest init` 的别名。

### `apply` — 将 preset 应用到现有项目

```bash
npx shadcn@latest apply [preset] [options]
```

将 preset 应用到现有项目，覆盖由 preset 驱动的配置、字体、CSS 变量和检测到的 UI 组件。

| Flag | 简写 | 描述 | 默认值 |
| ------------------- | ----- | ------------------------------------------ | ------- |
| `--preset <preset>` | — | Preset 配置（命名形式、code 或 URL） | — |
| `--yes` | `-y` | 跳过确认提示 | `false` |
| `--cwd <cwd>` | `-c` | 工作目录 | current |
| `--silent` | `-s` | 静默输出 | `false` |

`[preset]` 是 `--preset <preset>` 的简写。如果两者都提供，它们必须匹配。
如果未提供 preset，CLI 会提示打开 `ui.shadcn.com/create` 上的自定义 preset builder。

### `add` — 添加组件

> **重要：** 如需将本地组件与 upstream 对比或预览变更，始终使用 `npx shadcn@latest add <component> --dry-run`、`--diff` 或 `--view`。绝不要手动从 GitHub 或其他来源获取 raw files。CLI 会自动处理注册表解析、文件路径和 CSS diff。

```bash
npx shadcn@latest add [components...] [options]
```

接受组件名称、带注册表前缀的名称（`@magicui/shimmer-button`）、URL 或本地路径。

| Flag | 简写 | 描述 | 默认值 |
| --------------- | ----- | -------------------------------------------------------------------------------------------------------------------- | ------- |
| `--yes` | `-y` | 跳过确认提示 | `false` |
| `--overwrite` | `-o` | 覆盖现有文件 | `false` |
| `--cwd <cwd>` | `-c` | 工作目录 | current |
| `--all` | `-a` | 添加所有可用组件 | `false` |
| `--path <path>` | `-p` | 组件目标路径 | — |
| `--silent` | `-s` | 静默输出 | `false` |
| `--dry-run` | | 预览所有变更但不写入文件 | `false` |
| `--diff [path]` | | 显示 diff。不带 path 时显示前 5 个文件；带 path 时只显示该文件（隐含 `--dry-run`） | — |
| `--view [path]` | | 显示文件内容。不带 path 时显示前 5 个文件；带 path 时只显示该文件（隐含 `--dry-run`） | — |

#### Dry-Run 模式

使用 `--dry-run` 预览 `add` 会执行的操作，但不写入任何文件。`--diff` 和 `--view` 都隐含 `--dry-run`。

```bash
# Preview all changes.
npx shadcn@latest add button --dry-run

# Show diffs for all files (top 5).
npx shadcn@latest add button --diff

# Show the diff for a specific file.
npx shadcn@latest add button --diff button.tsx

# Show contents for all files (top 5).
npx shadcn@latest add button --view

# Show the full content of a specific file.
npx shadcn@latest add button --view button.tsx

# Works with URLs too.
npx shadcn@latest add https://api.npoint.io/abc123 --dry-run

# CSS diffs.
npx shadcn@latest add button --diff globals.css
```

**何时使用 dry-run：**

- 当用户询问 “what files will this add?” 或 “what will this change?” 时，使用 `--dry-run`。
- 覆盖现有组件前，使用 `--diff` 预览变更。
- 当用户想在不安装的情况下检查组件源代码时，使用 `--view`。
- 检查会对 `globals.css` 做哪些 CSS 变更时，使用 `--diff globals.css`。
- 当用户要求在安装前审查或审计第三方注册表代码时，使用 `--view` 检查源码。

> **`npx shadcn@latest add --dry-run` 与 `npx shadcn@latest view`：** 当用户想预览对其项目的变更时，优先使用 `npx shadcn@latest add --dry-run/--diff/--view`，而不是 `npx shadcn@latest view`。`npx shadcn@latest view` 只显示原始注册表元数据。`npx shadcn@latest add --dry-run` 会显示在用户项目中实际会发生什么：解析后的文件路径、与现有文件的 diff，以及 CSS 更新。只有当用户想在没有项目上下文的情况下浏览注册表信息时，才使用 `npx shadcn@latest view`。

#### 来自 Upstream 的智能合并

完整工作流见 [SKILL.md 中的更新组件](./SKILL.md#更新组件)。

### `search` — 搜索注册表

```bash
npx shadcn@latest search <registries...> [options]
```

跨注册表模糊搜索。也可写作别名 `npx shadcn@latest list`。不带 `-q` 时列出所有 items。

| Flag | 简写 | 描述 | 默认值 |
| ------------------- | ----- | ---------------------- | ------- |
| `--query <query>` | `-q` | 搜索查询 | — |
| `--limit <number>` | `-l` | 每个注册表的最大 items 数 | `100` |
| `--offset <number>` | `-o` | 跳过的 items 数 | `0` |
| `--cwd <cwd>` | `-c` | 工作目录 | current |

### `view` — 查看 item 详情

```bash
npx shadcn@latest view <items...> [options]
```

显示 item 信息，包括文件内容。示例：`npx shadcn@latest view @shadcn/button`。

### `docs` — 获取组件文档 URL

```bash
npx shadcn@latest docs <components...> [options]
```

输出组件文档、示例和 API 参考的解析后 URL。接受一个或多个组件名。抓取这些 URL 可获得实际内容。

`npx shadcn@latest docs input button` 的示例输出：

```
base  radix

input
  docs      https://ui.shadcn.com/docs/components/radix/input
  examples  https://raw.githubusercontent.com/.../examples/input-example.tsx

button
  docs      https://ui.shadcn.com/docs/components/radix/button
  examples  https://raw.githubusercontent.com/.../examples/button-example.tsx
```

某些组件会包含指向底层库的 `api` 链接（例如 command 组件的 `cmdk`）。

### `diff` — 检查更新

不要使用此命令。改用 `npx shadcn@latest add --diff`。

### `info` — 项目信息

```bash
npx shadcn@latest info [options]
```

显示项目信息和 `components.json` 配置。应先运行此命令，以发现项目的 framework、aliases、Tailwind 版本和解析后路径。

| Flag | 简写 | 描述 | 默认值 |
| ------------- | ----- | ----------------- | ------- |
| `--cwd <cwd>` | `-c` | 工作目录 | current |

**Project Info 字段：**

| 字段 | 类型 | 含义 |
| -------------------- | --------- | ------------------------------------------------------------------ |
| `framework` | `string` | 检测到的 framework（`next`、`vite`、`react-router`、`start` 等） |
| `frameworkVersion` | `string` | Framework 版本（例如 `15.2.4`） |
| `isSrcDir` | `boolean` | 项目是否使用 `src/` 目录 |
| `isRSC` | `boolean` | 是否启用 React Server Components |
| `isTsx` | `boolean` | 项目是否使用 TypeScript |
| `tailwindVersion` | `string` | `"v3"` 或 `"v4"` |
| `tailwindConfigFile` | `string` | Tailwind 配置文件路径 |
| `tailwindCssFile` | `string` | 全局 CSS 文件路径 |
| `aliasPrefix` | `string` | 导入 alias 前缀（例如 `@`、`~`、`@/`） |
| `packageManager` | `string` | 检测到的包管理器（`npm`、`pnpm`、`yarn`、`bun`） |

**Components.json 字段：**

| 字段 | 类型 | 含义 |
| -------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `base` | `string` | Primitive 库（`radix` 或 `base`），决定组件 API 和可用 props |
| `style` | `string` | 视觉风格（例如 `nova`、`vega`） |
| `rsc` | `boolean` | 配置中的 RSC flag |
| `tsx` | `boolean` | TypeScript flag |
| `tailwind.config` | `string` | Tailwind 配置路径 |
| `tailwind.css` | `string` | 全局 CSS 路径，自定义 CSS 变量应写在这里 |
| `iconLibrary` | `string` | 图标库，决定图标导入包（例如 `lucide-react`、`@tabler/icons-react`） |
| `aliases.components` | `string` | 组件导入 alias（例如 `@/components`） |
| `aliases.utils` | `string` | Utils 导入 alias（例如 `@/lib/utils`） |
| `aliases.ui` | `string` | UI 组件 alias（例如 `@/components/ui`） |
| `aliases.lib` | `string` | Lib alias（例如 `@/lib`） |
| `aliases.hooks` | `string` | Hooks alias（例如 `@/hooks`） |
| `resolvedPaths` | `object` | 每个 alias 对应的绝对文件系统路径 |
| `registries` | `object` | 已配置的自定义注册表 |

**Links 字段：**

`info` 输出包含 **Links** 部分，里面是组件文档、源码和示例的模板化 URL。需要解析后的 URL 时，改用 `npx shadcn@latest docs <component>`。

### `build` — 构建自定义注册表

```bash
npx shadcn@latest build [registry] [options]
```

将 `registry.json` 构建为单独的 JSON 文件以便分发。默认输入：`./registry.json`，默认输出：`./public/r`。

| Flag | 简写 | 描述 | 默认值 |
| ----------------- | ----- | ----------------- | ------------ |
| `--output <path>` | `-o` | 输出目录 | `./public/r` |
| `--cwd <cwd>` | `-c` | 工作目录 | current |

---

## Templates

| 值 | Framework | Monorepo 支持 |
| -------------- | -------------- | ---------------- |
| `next` | Next.js | 是 |
| `vite` | Vite | 是 |
| `start` | TanStack Start | 是 |
| `react-router` | React Router | 是 |
| `astro` | Astro | 是 |
| `laravel` | Laravel | 否 |

所有 templates 都支持通过 `--monorepo` flag 搭建 monorepo。传入该 flag 时，CLI 使用 monorepo 专用 template 目录（例如 `next-monorepo`、`vite-monorepo`）。当既未传入 `--monorepo` 也未传入 `--no-monorepo` 时，CLI 会以交互方式提示。Laravel 不支持 monorepo 搭建。

---

## Presets

通过 `--preset` 指定 preset 有三种方式：

1. **命名形式：** `--preset nova` 或 `--preset lyra`
2. **Code：** `--preset a2r6bw`（带版本前缀的 base62 字符串，例如 `a2r6bw` 或 `b0`）
3. **URL：** `--preset "https://ui.shadcn.com/init?base=radix&style=nova&..."`

> **重要：** 绝不要尝试手动解码、抓取或解析 preset codes。Preset codes 是不透明的；请直接传给 `npx shadcn@latest init --preset <code>`，让 CLI 处理解析。
> 覆盖现有项目 preset 时，使用 `npx shadcn@latest apply --preset <code>`。

## 切换 Presets

先询问用户：对现有组件执行 **overwrite**、**merge** 还是 **skip**？

- **Overwrite / Re-install** → `npx shadcn@latest apply --preset <code>`。用新的 preset 样式覆盖所有检测到的组件文件。适用于用户未自定义组件的情况。
- **Merge** → `npx shadcn@latest init --preset <code> --force --no-reinstall`，然后运行 `npx shadcn@latest info` 获取已安装组件列表，并使用[智能合并工作流](./SKILL.md#更新组件)逐个更新它们，同时保留本地修改。适用于用户已自定义组件的情况。
- **Skip** → `npx shadcn@latest init --preset <code> --force --no-reinstall`。只更新配置和 CSS 变量，保持现有组件不变。

始终在用户项目目录内运行 preset 命令。`apply` 只适用于包含 `components.json` 文件的现有项目。CLI 会自动保留 `components.json` 中当前的 base（`base` 与 `radix`）。如果必须使用 scratch/temp 目录（例如用于 `--dry-run` 比较），请显式传入 `--base <current-base>`，preset codes 不会编码 base。
