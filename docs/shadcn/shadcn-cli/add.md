# shadcn CLI 解读

## `add`

### 它是做什么的

`add` 命令用于把 `shadcn` 的组件和相关依赖添加到你的项目里。

最常见的用法是：

```bash
pnpm dlx shadcn@latest add [component]
```

例如：

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add form
```

它做的事情通常不只是“拷贝一个组件文件”，而是会一起处理：

- 组件源码
- 组件依赖
- 组件依赖的 `utils`、`hooks`、`lib`
- 对应的 import 路径

所以它本质上是一个“按你项目配置生成代码”的命令，不是单纯下载组件。

### 它和 `components.json` 的关系

`add` 能不能正确工作，很大程度取决于 `components.json`。

因为 CLI 会根据 `components.json` 来判断：

- UI 组件生成到哪里
- `utils.ts` 放哪里
- hooks 放哪里
- lib 放哪里
- Tailwind 样式入口在哪里
- 当前项目是否使用 RSC、TSX、CSS Variables

也就是说，`add` 不是固定往 `components/ui` 里写，而是按你的 alias 配置决定落点。

例如如果你配置成：

```json
"aliases": {
  "components": "@/shared/ui",
  "utils": "@/shared/lib/utils",
  "ui": "@/shared/ui",
  "lib": "@/shared/lib",
  "hooks": "@/shared/hooks"
}
```

那么后面执行 `add button` 时，生成位置就会倾向于：

- `src/shared/ui/button.tsx`
- `src/shared/lib/utils.ts`
- `src/shared/hooks/...`

这也是把 `shadcn` 接入 FSD 的关键。

## 基本语法

```bash
pnpm dlx shadcn@latest add [component]
```

其中 `[component]` 可以是：

- 一个组件名
- 一个 URL
- 一个本地组件路径

官方帮助里写的是：

```bash
Usage: shadcn add [options] [components...]
```

这里的 `[components...]` 带 `...`，表示你一次可以传多个组件。

例如：

```bash
pnpm dlx shadcn@latest add button dialog input
```

## 常用参数解读

### `-y, --yes`

```bash
-y, --yes
```

作用：跳过确认提示。

适合场景：
- 你已经确定要安装
- 想减少交互
- 写脚本时使用

例如：

```bash
pnpm dlx shadcn@latest add button -y
```

### `-o, --overwrite`

```bash
-o, --overwrite
```

作用：如果目标文件已经存在，允许覆盖。

这个参数要谨慎，因为 `shadcn` 是把源码直接写进你的项目，不是装 npm 包。  
如果你已经改过某个组件，再用覆盖，很可能把你自己的修改冲掉。

适合场景：
- 你明确要用新版模板覆盖旧文件
- 你确认当前文件没有手改

不适合场景：
- 已经深度改造过组件
- 不确定文件有没有业务修改

### `-c, --cwd <cwd>`

```bash
-c, --cwd <cwd>
```

作用：指定执行命令的工作目录。

默认情况下，它会在当前目录找项目配置。  
如果你不在项目根目录执行，或者在 monorepo 里操作某个子项目，这个参数就很有用。

例如：

```bash
pnpm dlx shadcn@latest add button -c /path/to/project
```

### `-a, --all`

```bash
-a, --all
```

作用：一次性添加所有可用组件。

这通常不适合普通业务项目，因为：

- 会生成大量你暂时不用的组件
- 会增加代码体积和认知负担
- 和 FSD 的“按需要引入”思路不太一致

更适合场景：
- 组件库演示项目
- 学习用 playground
- 想一次性查看所有源码实现

### `-p, --path <path>`

```bash
-p, --path <path>
```

作用：指定组件添加到哪个路径。

这个参数可以临时覆盖默认生成位置。

但要注意：
- 它更适合临时用途
- 不是长期目录管理的最佳方式
- 如果你已经在 `components.json` 里配好了 `aliases.ui`，通常优先依赖配置，而不是每次手写 `--path`

在 FSD 场景里，更推荐：
- 通过 `components.json` 固定 `shared/ui`
- `--path` 只在特殊情况临时使用

### `-s, --silent`

```bash
-s, --silent
```

作用：减少命令输出。

适合脚本化场景，或者你不想看太多终端日志时使用。

### `--dry-run`

```bash
--dry-run
```

作用：预览这次命令会改什么，但**不真正写文件**。

这个参数非常有用，尤其适合：

- 你刚改完 `components.json`
- 想确认 shadcn 会把组件生成到哪里
- 想先看一眼改动范围
- 害怕 CLI 改错路径

例如：

```bash
pnpm dlx shadcn@latest add button --dry-run
```

这是你当前学习 FSD 和调整目录结构时最值得多用的参数之一。

### `--diff [path]`

```bash
--diff [path]
```

作用：查看某个文件的 diff。

它更像是调试/检查工具，适合你想确认某个文件会怎么变化时使用。

### `--view [path]`

```bash
--view [path]
```

作用：查看某个文件内容，而不真正写入。

可以理解成“先看生成内容再决定要不要装”。

### `-h, --help`

```bash
-h, --help
```

作用：查看帮助。

如果以后 `shadcn` CLI 版本变化，这是最直接的自查方式。

## 对你当前学习阶段最有用的参数

如果你现在正在做：

- FSD 目录整理
- `components.json` alias 调整
- `shared/ui`、`shared/lib`、`shared/hooks` 落位

那最有用的是这几个：

1. `--dry-run`
先看会生成到哪，不直接写文件。

2. `-y`
当你已经确认配置正确后，减少交互。

3. `-o`
只在你明确要覆盖已有文件时用。

4. `-c`
如果不是在项目根目录执行时再用。

## 和 FSD 的关系

`add` 命令本身不懂 FSD，它只懂你的配置。

所以是否符合 FSD，不取决于 `add` 命令本身，而取决于：

- 你的 `components.json` 怎么配
- 你是否把生成的代码放到 `shared`
- 你后续是否再对基础组件做业务边界区分

对于你当前项目，更合理的目标是：

- 基础 shadcn UI 组件进 `shared/ui`
- shadcn 生成的通用工具进 `shared/lib`
- shadcn 生成的通用 hooks 进 `shared/hooks`

这样 `add` 就是在给你的 FSD 结构“投放基础设施代码”。

## 实际使用建议

你现在最适合的命令习惯是：

1. 先改好 `components.json` 的 alias。
2. 先用 `--dry-run` 看生成路径是否正确。
3. 确认无误后，再真正执行 `add`。
4. 尽量一次只加当前需要的组件，不要直接 `--all`。
5. 对已经改过的组件，不要轻易用 `--overwrite`。

## 一句话总结

`shadcn add` 的本质不是“安装 UI 包”，而是“按照你的项目配置，把组件源码和相关依赖写进你的项目”。  
在 FSD 项目里，它能不能用得舒服，关键不在命令本身，而在 `components.json` 的路径配置是否合理。
