# 实例解读

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

## 1. @layer base

这是把里面这批样式放进 base 层。

你可以先理解成：

- base：基础样式层
- components：组件样式层
- utilities：工具类层

一般放什么？

- html
- body
- a
- h1
- button
- -
- 表单元素默认样式
- 全局 reset / 基础主题样式

## 2. 大括号里的内容是什么

里面其实还是普通 CSS 规则，只不过写在 base 层里面。

也就是：

```css
  选择器 {
    样式
  }
```

## 3. 具体规则解读

```css
* {
  @apply border-border outline-ring/50;
}
```

- 选择器：\*
- 表示所有元素
- 给所有元素应用一组 Tailwind 工具类

# 3. @apply 又是什么意思

@apply 是 Tailwind 的语法，作用是：

> 把 utility class 对应的样式直接展开到当前这个 CSS 规则里。

比如：

```css
body {
  @apply bg-background text-foreground;
}
```

等于在说：

- 把 bg-background 这套背景样式
- 和 text-foreground 这套文字颜色样式
- 直接应用到 body

你可以把它理解成：

> 在 CSS 里复用 Tailwind 类名，而不是去 JSX 里写 className
