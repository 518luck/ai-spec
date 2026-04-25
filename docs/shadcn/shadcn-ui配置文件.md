# 配置文件解析

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-vega",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/styles/global.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

## 字段说明

### `$schema`

作用：给编辑器提供 schema 校验和自动补全，方便检查 `components.json` 的字段是否写对。

### `style`

作用：指定 shadcn 当前使用的视觉风格。后续执行 `add` 命令生成组件时，会按这套风格输出默认样式。

### `rsc`

作用：表示是否按 React Server Components 兼容模式生成组件。Next.js App Router 项目通常为 `true`。

### `tsx`

作用：表示生成的组件文件是否使用 TypeScript React 格式，也就是 `.tsx` 文件。

### `tailwind`

作用：声明当前项目里 Tailwind 的接入方式，包括样式入口、基础色系、是否使用 CSS 变量等。

#### `tailwind.config`

作用：指定 Tailwind 配置文件路径。当前为空，表示当前项目不需要额外显式指定。

#### `tailwind.css`

作用：告诉 shadcn 全局样式入口文件在哪。CLI 初始化或添加组件时，会参考这里去更新对应的 CSS 文件。

#### `tailwind.baseColor`

作用：指定当前使用的基础色系，例如 `neutral`、`zinc`、`stone`。它会影响生成组件的默认色彩基线。

#### `tailwind.cssVariables`

作用：表示是否使用 CSS Variables 来组织主题颜色。开启后，颜色通常通过 `--background`、`--foreground` 这类变量统一管理。

#### `tailwind.prefix`

作用：指定 Tailwind 类名前缀。当前为空，表示类名不额外添加前缀。

### `iconLibrary`

作用：指定默认图标库。后续生成需要图标的组件时，会优先按这套图标库的 import 方式输出。

### `rtl`

作用：表示是否启用 RTL（从右到左）布局支持。当前为 `false`，说明项目不面向阿拉伯语这类 RTL 场景。

### `aliases`

作用：定义 shadcn CLI 生成文件时使用的路径别名。也就是告诉它组件、工具函数、hooks 分别应该放在哪里。

#### `aliases.components`

作用：组件总目录别名，表示普通组件默认的基础目录。

#### `aliases.utils`

作用：工具函数文件别名。像 `utils.ts` 这种通用工具文件会按这个路径生成或引用。

#### `aliases.ui`

作用：基础 UI 组件目录别名。像 `button.tsx`、`dialog.tsx` 这类组件通常会按这个目录生成。

#### `aliases.lib`

作用：通用库目录别名，用于生成或引用一些公共辅助模块。

#### `aliases.hooks`

作用：hooks 目录别名。后续如果某些组件依赖自定义 hook，会按这个目录约定生成或引用。

### `menuColor`

作用：指定菜单组件的配色方案，主要影响导航、侧边栏等菜单类组件的默认颜色表现。

### `menuAccent`

作用：指定菜单选中态、hover 态等强调方式。`subtle` 表示强调更克制、更轻。

### `registries`

作用：配置额外的组件注册源。当前为空，表示只使用 shadcn 官方默认 registry，没有接第三方或私有 registry。
