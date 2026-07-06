# shadcn CSS 笔记

## `@custom-variant dark (&:is(.dark *));`

这是 Tailwind v4 的自定义 variant 语法，作用是：

定义一个叫 `dark` 的变体，让你以后可以写 `dark:...` 类名。

你这句：

```css
@custom-variant dark (&:is(.dark *));
```

可以先粗暴翻译成：

> 定义一个 `dark` 变体：当当前元素处在 `.dark` 作用域里时，这个变体生效。

---

## 拆开看

### `@custom-variant`

这是 Tailwind 提供的语法。\
作用是：自定义一个变体（variant）。

Tailwind 里的变体你应该见过很多：

- `hover:`
- `focus:`
- `md:`
- `dark:`

这里就是在告诉 Tailwind：

> 我要自己定义 `dark:` 这个变体怎么判断。

### `dark`

这是你定义的变体名称。

也就是说后面你就可以写：

```tsx
<div className="dark:bg-black dark:text-white" />
```

这里的 `dark:` 就对应这个名字。

### `(&:is(.dark *))`

这部分是变体的匹配规则。

它意思不太好一眼看懂，但你可以先这样理解：

- `&`：代表当前这个 utility 最终对应的选择器
- `:is(.dark *)`：表示“这个元素处在 `.dark` 这个祖先作用域里”

也就是：

> 当前样式只在元素位于 `.dark` 容器下面时生效。

---

## 它最终想达到什么效果

比如你页面结构是：

```html
<html class="dark">
  <body>
    <div class="bg-white dark:bg-black"></div>
  </body>
</html>
```

那么：

- 默认 `bg-white` 会生效
- 当祖先元素上存在 `.dark` 类时，`dark:bg-black` 也会生效

也就是说，这个 `div` 因为位于 `.dark` 容器内部，所以会命中 `dark:` 变体。

---

## 它和默认 dark mode 的区别

Tailwind 默认的 `dark:` 通常基于：

```css
prefers-color-scheme: dark
```

也就是跟随系统深色模式。

而加了这句以后，你就把 `dark:` 改成了：

- 不再看系统偏好
- 改成看 DOM 里有没有 `.dark` 这个类

也就是说，暗色主题变成“手动 class 控制”了。

Tailwind 官方更常见的示例是：

```css
@custom-variant dark (&:where(.dark, .dark *));
```

你现在这个 `:is(.dark *)` 和官方示例思路很接近，都是让 `dark:` 基于 `.dark` 类工作。

---

## 它解决什么问题

它解决的是：

> 我不想只跟随系统主题，我想自己手动切换 dark mode。

比如你页面里可以通过 JS 给 `<html>` 加上：

```html
<html class="dark">
```

或者移除它：

```html
<html>
```

于是 `dark:*` 工具类就会跟着生效或失效。

---

## 人话总结

这句可以直接翻译成：

> 定义 Tailwind 的 `dark:` 变体，让它在元素位于 `.dark` 容器内部时生效。

---

## 补充

相关官方文档：

- Tailwind Dark Mode\
  https://tailwindcss.com/docs/dark-mode
- Tailwind Adding custom variants\
  https://tailwindcss.com/docs/adding-custom-styles
