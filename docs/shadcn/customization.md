# 自定义与主题

组件引用语义化 CSS 变量 tokens。修改这些变量即可改变所有组件。

## 目录

- 工作原理（CSS 变量 → Tailwind utilities → 组件）
- 颜色变量与 OKLCH 格式
- Dark mode 设置
- 修改主题（presets、CSS 变量）
- 添加自定义颜色（Tailwind v3 和 v4）
- 圆角
- 自定义组件（variants、className、wrapper）
- 检查更新

---

## 工作原理

1. CSS 变量定义在 `:root`（light）和 `.dark`（dark mode）中。
2. Tailwind 将它们映射为 utilities：`bg-primary`、`text-muted-foreground` 等。
3. 组件使用这些 utilities。修改变量会改变所有引用它的组件。

---

## 颜色变量

每种颜色都遵循 `name` / `name-foreground` 约定。基础变量用于背景，`-foreground` 用于该背景上的文本/图标。

| 变量                                         | 用途               |
| -------------------------------------------- | ------------------ |
| `--background` / `--foreground`              | 页面背景和默认文本 |
| `--card` / `--card-foreground`               | Card 表面          |
| `--primary` / `--primary-foreground`         | 主要按钮和操作     |
| `--secondary` / `--secondary-foreground`     | 次要操作           |
| `--muted` / `--muted-foreground`             | 弱化/禁用状态      |
| `--accent` / `--accent-foreground`           | Hover 和强调状态   |
| `--destructive` / `--destructive-foreground` | 错误和破坏性操作   |
| `--border`                                   | 默认边框颜色       |
| `--input`                                    | 表单输入边框       |
| `--ring`                                     | Focus ring 颜色    |
| `--chart-1` 到 `--chart-5`                   | 图表/数据可视化    |
| `--sidebar-*`                                | Sidebar 专用颜色   |
| `--surface` / `--surface-foreground`         | 次级表面           |

颜色使用 OKLCH：`--primary: oklch(0.205 0 0)`，其中值分别表示 lightness（0-1）、chroma（0 = gray）和 hue（0-360）。

---

## Dark Mode

通过根元素上的 `.dark` 进行基于 class 的切换。在 Next.js 中，使用 `next-themes`：

```tsx
import { ThemeProvider } from "next-themes"

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

---

## 修改主题

```bash
# Apply a preset code from ui.shadcn.com.
npx shadcn@latest apply --preset a2r6bw

# Positional shorthand also works.
npx shadcn@latest apply a2r6bw

# Switch to a named preset and overwrite existing components.
npx shadcn@latest apply --preset nova

# Preserve existing components instead.
npx shadcn@latest init --preset nova --force --no-reinstall

# Use a custom theme URL.
npx shadcn@latest apply --preset "https://ui.shadcn.com/init?base=radix&style=nova&theme=blue&..."
```

也可以直接在 `globals.css` 中编辑 CSS 变量。

---

## 添加自定义颜色

将变量添加到 `npx shadcn@latest info` 中 `tailwindCssFile` 指向的文件（通常是 `globals.css`）。绝不要为此创建新的 CSS 文件。

```css
/* 1. Define in the global CSS file. */
:root {
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
}
.dark {
  --warning: oklch(0.41 0.11 46);
  --warning-foreground: oklch(0.99 0.02 95);
}
```

```css
/* 2a. Register with Tailwind v4 (@theme inline). */
@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

当 `tailwindVersion` 为 `"v3"`（通过 `npx shadcn@latest info` 检查）时，改在 `tailwind.config.js` 中注册：

```js
// 2b. Register with Tailwind v3 (tailwind.config.js).
module.exports = {
  theme: {
    extend: {
      colors: {
        warning: "oklch(var(--warning) / <alpha-value>)",
        "warning-foreground":
          "oklch(var(--warning-foreground) / <alpha-value>)",
      },
    },
  },
}
```

```tsx
// 3. Use in components.
<div className="bg-warning text-warning-foreground">Warning</div>
```

---

## 圆角

`--radius` 全局控制圆角。组件会从它派生值（`rounded-lg` = `var(--radius)`，`rounded-md` = `calc(var(--radius) - 2px)`）。

---

## 自定义组件

错误/正确示例另见：[rules/styling.md](./rules/styling.md)。

优先按以下顺序选择做法：

### 1. 内置 variants

```tsx
<Button variant="outline" size="sm">
  Click
</Button>
```

### 2. 通过 `className` 使用 Tailwind classes

```tsx
<Card className="mx-auto max-w-md">...</Card>
```

### 3. 添加新 variant

编辑组件源码，通过 `cva` 添加 variant：

```tsx
// components/ui/button.tsx
warning: "bg-warning text-warning-foreground hover:bg-warning/90",
```

### 4. Wrapper 组件

将 shadcn/ui primitives 组合成更高层组件：

```tsx
export function ConfirmDialog({ title, description, onConfirm, children }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## 检查更新

```bash
npx shadcn@latest add button --diff
```

如需在更新前精确预览会发生的变化，使用 `--dry-run` 和 `--diff`：

```bash
npx shadcn@latest add button --dry-run        # see all affected files
npx shadcn@latest add button --diff button.tsx # see the diff for a specific file
```

完整智能合并工作流见 [SKILL.md 中的更新组件](./SKILL.md#更新组件)。
