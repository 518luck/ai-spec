# @layer = 管样式层级

# @theme = 管主题 token

```css
@theme inline { ... }
```

不是 CSS 分层语法本身，而是 Tailwind v4 自己提供的主题声明机制。

- @theme 是 Tailwind v4 提供的 at-rule
- inline 不是你随便起的名字
- inline 是 @theme 的一个固定修饰形式/选项

  ## 为什么叫 inline

  它可以先粗略理解成：

  > 直接在当前 CSS 中内联声明这些 theme token

# @theme 后面常见的有这三种写法：

- @theme { ... }
- @theme inline { ... }
- @theme static { ... }

## 区别是：

### @theme { ... }

- 默认写法。
- 用来声明主题 token，让 Tailwind 生成对应的 utility。

这里的 utility 指的是 Tailwind 的工具类。

也就是你平时写在 className 里的这些东西：

- bg-red-500
- text-sm
- flex
- p-4
- rounded-lg

这些都叫 utility class，中文一般叫：

- 工具类
- 原子类

#### 举个最直接的例子

如果你写：

@theme {
--color-brand: #2563eb;
}

那 Tailwind 就可能让你在 JSX 里写：

```html
<div className="bg-brand text-white">Hello</div>
```

这里的 bg-brand 就是 utility class。
也就是 Tailwind 根据你声明的主题 token 推出来的工具类。

### @theme inline { ... }

- 当你的 theme 变量要引用别的变量时用。
- 官方文档明确说，像 --font-sans: var(--font-inter); 这种情况应使用 inline。
- 这样生成出来的 utility 会直接用目标值，避免 CSS 变量作用域解析出错。

### @theme static { ... }

- 用来强制“总是生成”这些 CSS 变量。
- 默认情况下，Tailwind 只输出实际用到的变量；static 会让它全部生成出来。

# @theme映射规则

- 你写的是 theme token 名
- Tailwind 给你生成的是 utility class 名

  它不会原样把 --color-brand 变成类名 --color-brand，而是按命名空间规则转换。

## 你写的是什么

```css
@theme {
  --color-brand: #2563eb;
}
```

这里的：

- --color-brand

是一个 Tailwind 主题变量名。

它有两个部分：

- color：命名空间
- brand：具体名字

## Tailwind 怎么理解它

Tailwind 看到：

--color-brand

会理解成：

> 这是一个颜色 token，名字叫 brand

然后它会基于“颜色”这类 token 去生成对应的工具类，比如：

- bg-brand
- text-brand
- border-brand
- fill-brand

所以不是“直接把变量名拿来当类名”，而是：

> Tailwind 先识别 token 类型，再生成对应类别的 utility

# 常见的命名空间

最常见的几类可以这样理解，不用一开始全记住，先抓最常用的。

## --color-\*

表示“颜色 token”。

例如：

```css
@theme {
  --color-brand: #2563eb;
}
```

通常会对应这类 utility：

- bg-brand
- text-brand
- border-brand
- fill-brand
- stroke-brand
- 有时还有装饰相关颜色类

也就是：
同一个颜色 token，可以被不同“用途前缀”消费。

———

## --font-\*

表示“字体 token”。

例如：

```css
@theme {
  --font-display: "Satoshi", sans-serif;
}
```

通常对应：

- font-display

也就是说：
你定义一个字体名，Tailwind 给你一个字体类。

———

## --breakpoint-\*

表示“断点 token”。

例如：

```css
@theme {
  --breakpoint-3xl: 120rem;
}
```

通常用于响应式变体。
你不会直接写成普通样式类，而会更像：

- 3xl:grid-cols-6
- 3xl:text-lg

也就是说：
它定义的是新的响应式前缀。

———

## --spacing-\*

表示“间距 token”。

例如你如果定义某些 spacing 变量，Tailwind 会把它接入各种 spacing 相关 utility。

常见会影响：

- p-\*
- m-\*
- gap-\*
- space-x-\*
- w-\*
- h-\*

这一类比前面稍微绕一点，但本质就是：
spacing token 会进入一整套尺寸/间距系统。

———

## --radius-\*

表示“圆角 token”。

例如：

```css
@theme {
  --radius-xl: 1rem;
}
```

通常会影响：

- rounded-xl

———

## --shadow-\*

表示“阴影 token”。

例如：

```css
@theme {
  --shadow-card: 0 8px 30px rgba(0, 0, 0, 0.12);
}
```

通常会对应：

- shadow-card

———

## --text-\*

表示“文本尺寸 token”。

这类会影响文字大小相关 utility。

# Tailwind 类名固定命名格式

- bg-brand
- shadow-card

最简单理解就是：

用途前缀-值

> 这里前半部分表示“干什么”，后半部分表示“用哪一个值”。

## 所以 Tailwind 类名不是随便来的

它基本是在做：

`[属性类别]-[token名]`

或者更复杂一点：

`[变体]:[属性类别]-[token名]`

像 bg-red-500、text-zinc-800 这种，通常可以拆成 三段 来看：

用途前缀 - 名称 - 等级
