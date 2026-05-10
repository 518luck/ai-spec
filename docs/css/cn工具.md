# `cn` 工具学习笔记

## 1. 这是什么

`cn` 是 `shadcn/ui` 中常见的一个工具函数，用来处理 `className`：

- 拼接多个类名
- 按条件添加类名
- 自动合并冲突的 Tailwind CSS 类

常见实现：

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

可以把它理解成两层能力的组合：

- `clsx`：负责“把类名拼起来”
- `twMerge`：负责“把冲突的 Tailwind 类合并掉”

---

## 2. `cn` 由什么组成

### 2.1 `clsx`

`clsx` 的作用是把不同形式的类名参数整理成一个字符串。

例如：

```ts
clsx("px-4", "py-2");
clsx("px-4", false && "hidden");
clsx("px-4", isActive && "bg-blue-500");
clsx({ hidden: false, block: true });
```

它会忽略 `false`、`null`、`undefined` 这类假值，最终输出一个可直接放进 `className` 的字符串。

### 2.2 `twMerge`

`twMerge` 的作用是处理 Tailwind CSS 中相互冲突的类名。

例如：

```ts
twMerge("px-2 px-4"); // "px-4"
twMerge("text-sm text-lg"); // "text-lg"
```

因为这些类控制的是同一类样式，后面的值应该覆盖前面的值。

### 2.3 `cn`

`cn` 先使用 `clsx` 拼接类名，再使用 `twMerge` 合并 Tailwind 冲突。

例如：

```ts
cn("px-2", "px-4"); // "px-4"
```

所以 `cn` 比单独使用 `clsx` 更适合 Tailwind 项目。

---

## 3. 基础用法

### 3.1 普通拼接

```ts
clsx("px-4", "py-2");
```

结果：

```ts
"px-4 py-2";
```

这就是最基础的类名拼接。

### 3.2 条件拼接

```ts
clsx("px-4", isActive && "bg-blue-500");
```

如果 `isActive` 为 `true`，结果是：

```ts
"px-4 bg-blue-500";
```

如果 `isActive` 为 `false`，结果是：

```ts
"px-4";
```

这里的核心不是“把 boolean 当作类名传进去”，而是：

**用 boolean 决定某个类名要不要参与拼接。**

---

## 4. boolean 在 `clsx` 里是干什么的

### 4.1 最常见写法：`条件 && 类名`

```ts
clsx("px-4", false && "hidden");
```

因为 JavaScript 中：

```ts
false && "hidden"; // false
true && "hidden"; // "hidden"
```

所以：

```ts
clsx("px-4", false && "hidden");
```

等价于：

```ts
clsx("px-4", false);
```

而 `clsx` 会忽略 `false`，所以最终结果是：

```ts
"px-4";
```

如果改成：

```ts
clsx("px-4", true && "hidden");
```

结果就是：

```ts
"px-4 hidden";
```

### 4.2 实际意义

boolean 的作用就是：

- 条件成立时，加上这个类名
- 条件不成立时，忽略这个类名

例如：

```ts
clsx(
  "btn",
  isActive && "bg-blue-500",
  disabled && "opacity-50",
  isHidden && "hidden",
);
```

假设：

```ts
isActive = true;
disabled = false;
isHidden = false;
```

结果就是：

```ts
"btn bg-blue-500";
```

---

## 5. 常见传参形式

`clsx` 不是有很多方法的库，它本质上就是一个函数，但支持多种参数类型。

### 5.1 字符串

```ts
clsx("a", "b", "c");
```

结果：

```ts
"a b c";
```

### 5.2 条件表达式

```ts
clsx("a", isActive && "b");
```

适合简单条件，最常用。

### 5.3 对象

```ts
clsx({
  hidden: false,
  block: true,
});
```

结果：

```ts
"block";
```

对象写法表示：

- key：类名
- value：是否保留这个类名

再看一个更常见的例子：

```ts
clsx({
  "bg-blue-500": isActive,
  "opacity-50": disabled,
  "cursor-not-allowed": disabled,
  hidden: isHidden,
});
```

这种写法适合条件比较多的场景。

### 5.4 数组

```ts
clsx(["a", "b", isActive && "c"]);
```

数组也可以传，`clsx` 会自动展开。

### 5.5 混合使用

```ts
clsx("base", isActive && "active", ["px-4", "py-2"], {
  hidden: false,
  block: true,
});
```

结果可能是：

```ts
"base active px-4 py-2 block";
```

---

## 6. 在 React 组件里怎么用

```tsx
function Button({
  isActive,
  disabled,
  className,
}: {
  isActive: boolean;
  disabled: boolean;
  className?: string;
}) {
  return (
    <button
      className={cn(
        "rounded-md px-4 py-2 text-sm",
        isActive && "bg-blue-500 text-white",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      Button
    </button>
  );
}
```

这里的好处是：

- 组件可以有默认样式
- 可以根据状态动态加样式
- 可以接收外部传入的 `className`
- 外部传入的 Tailwind 类还能覆盖默认值

---

## 7. `clsx` 和 `cn` 的区别

### 7.1 只用 `clsx`

```ts
clsx("px-2", "px-4");
```

结果通常还是：

```ts
"px-2 px-4";
```

它只负责拼接，不负责理解 Tailwind 是否冲突。

### 7.2 用 `cn`

```ts
cn("px-2", "px-4");
```

结果：

```ts
"px-4";
```

因为 `cn` 内部又经过了 `twMerge` 处理。

结论：

- 普通项目用 `clsx` 就够了
- Tailwind 项目更适合用 `cn`

---

## 8. 使用技巧

### 8.1 默认类名写前面，条件类名写后面

```ts
clsx(
  "rounded px-4 py-2",
  primary && "bg-blue-500 text-white",
  danger && "bg-red-500 text-white",
);
```

这样结构最清楚。

### 8.2 条件少时优先用 `&&`

```ts
clsx("btn", isActive && "active");
```

适合 1 到 2 个条件，写法短，阅读成本低。

### 8.3 条件多时优先用对象

```ts
clsx("btn", {
  active: isActive,
  disabled: isDisabled,
  loading: isLoading,
});
```

适合状态较多的场景，可读性更好。

### 8.4 不要手动拼字符串

尽量不要写：

```ts
"btn " + (isActive ? "active" : "");
```

问题是：

- 可读性差
- 容易出现多余空格
- 条件多时维护困难

这正是 `clsx` 要解决的问题。

### 8.5 Tailwind 项目优先使用 `cn`

```ts
cn("px-2", isLarge && "px-4");
```

如果 `isLarge` 为 `true`，最终会保留更合理的 Tailwind 结果。

---

## 9. 一句话总结

- `clsx`：负责按条件拼接类名
- boolean：负责控制某个类名是否出现
- 对象写法：适合管理多个条件类名
- `twMerge`：负责合并冲突的 Tailwind 类
- `cn`：是 `clsx + twMerge` 的组合，更适合 Tailwind 项目
