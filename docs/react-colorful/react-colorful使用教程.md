# react-colorful 使用教程

## 1. 这是什么

`react-colorful` 是一个轻量级的 React 颜色选择器组件库。

核心特点：

- **极小**：gzip 后仅 2.8 KB，比 `react-color` 轻 13 倍
- **零依赖**：不引入任何第三方包，没有供应链风险
- **Tree-shakeable**：只打包你用到的那个 picker
- **TypeScript 内置**：无需额外安装 `@types`
- **移动端友好**：支持触摸屏拖拽
- **无障碍**：遵循 WAI-ARIA 规范
- **现代实现**：纯 hooks + 函数组件，无 class 组件

---

## 2. 为什么选它

目前 React 生态里最热门的拾色器库对比：

| 库                  | 周下载量 | 体积    | 维护状态           |
| ------------------- | -------- | ------- | ------------------ |
| **react-colorful**  | ~357 万  | 2.8 KB  | 活跃               |
| react-color         | ~128 万  | ~140 KB | 停更（4 年未更新） |
| react-color-palette | ~3.9 万  | 中      | 半活跃             |
| @uiw/react-color    | ~3.0 万  | 中      | 活跃               |

`react-colorful` 周下载量是 `react-color` 的近 3 倍，是当前 React 拾色器的事实标准。

适合的场景：

- 只需要一个干净、快速的拾色器
- 在意 bundle size 和客户端性能
- 输出格式是 hex / rgb / hsl 等标准色彩模型

不适合的场景：

- 需要 Sketch、Photoshop、Chrome 等拟物风格面板（那种选 `react-color` 或 `@hello-pangea/color`）

---

## 3. 安装

```bash
pnpm add react-colorful
```

---

## 4. 最基础用法

三行就能跑起来：

```tsx
import { useState } from "react";
import { HexColorPicker } from "react-colorful";

function App() {
  const [color, setColor] = useState("#aabbcc");
  return <HexColorPicker color={color} onChange={setColor} />;
}
```

- `color`：当前颜色值（受控）
- `onChange`：颜色变化时的回调，拖拽过程中会持续触发

---

## 5. 所有组件一览

`react-colorful` 提供了 13 个 picker 组件，对应不同的色彩模型和输入输出格式：

| 组件                    | 值示例                             | 说明               |
| ----------------------- | ---------------------------------- | ------------------ |
| `HexColorPicker`        | `"#ffffff"`                        | 最常用，hex 字符串 |
| `HexAlphaColorPicker`   | `"#ffffff88"`                      | hex + 透明度       |
| `RgbColorPicker`        | `{ r: 255, g: 255, b: 255 }`       | RGB 对象           |
| `RgbaColorPicker`       | `{ r: 255, g: 255, b: 255, a: 1 }` | RGB + 透明度       |
| `RgbStringColorPicker`  | `"rgb(255, 255, 255)"`             | RGB 字符串         |
| `RgbaStringColorPicker` | `"rgba(255, 255, 255, 1)"`         | RGBA 字符串        |
| `HslColorPicker`        | `{ h: 0, s: 0, l: 100 }`           | HSL 对象           |
| `HslaColorPicker`       | `{ h: 0, s: 0, l: 100, a: 1 }`     | HSL + 透明度       |
| `HslStringColorPicker`  | `"hsl(0, 0%, 100%)"`               | HSL 字符串         |
| `HslaStringColorPicker` | `"hsla(0, 0%, 100%, 1)"`           | HSL + 透明度字符串 |
| `HsvColorPicker`        | `{ h: 0, s: 0, v: 100 }`           | HSV 对象           |
| `HsvaColorPicker`       | `{ h: 0, s: 0, v: 100, a: 1 }`     | HSV + 透明度       |
| `HsvStringColorPicker`  | `"hsv(0, 0%, 100%)"`               | HSV 字符串         |
| `HsvaStringColorPicker` | `"hsva(0, 0%, 100%, 1)"`           | HSV + 透明度字符串 |

选择原则：**你的数据是什么格式，就用对应的 picker**。比如存 hex 就用 `HexColorPicker`，存 RGB 对象就用 `RgbColorPicker`。

---

## 6. Props 详解

所有 picker 共享同一套 props：

| Prop          | 类型                 | 说明                                             |
| ------------- | -------------------- | ------------------------------------------------ |
| `color`       | `string` 或 `object` | 当前颜色值（受控）                               |
| `onChange`    | `(color) => void`    | 每次颜色变化时触发（拖拽中持续触发）             |
| `onChangeEnd` | `(color) => void`    | 用户结束操作时触发（mouseup / touchend / keyup） |

此外，所有 picker 还接受普通 `div` 的全部属性（`className`、`style`、`aria-label` 等）。

### onChange vs onChangeEnd

```tsx
<HexColorPicker
  color={color}
  onChange={setColor} // 拖拽中实时更新 UI
  onChangeEnd={(color) => saveToDatabase(color)} // 松手后才存库
/>
```

- `onChange`：拖拽过程中高频触发，适合实时更新本地 state 和预览
- `onChangeEnd`：只在操作结束时触发一次，适合存库、undo/redo 等重操作

---

## 7. 搭配输入框（HexColorInput）

`react-colorful` 本身只提供色板，不带输入框。如果需要让用户手动输入 hex 值，用配套的 `HexColorInput`：

```tsx
import { HexColorPicker, HexColorInput } from "react-colorful";

function App() {
  const [color, setColor] = useState("#aabbcc");
  return (
    <div>
      <HexColorPicker color={color} onChange={setColor} />
      <HexColorInput
        color={color}
        onChange={setColor}
        placeholder="输入颜色"
        prefixed
      />
    </div>
  );
}
```

`HexColorInput` 的 props：

| Prop       | 默认值  | 说明                             |
| ---------- | ------- | -------------------------------- |
| `alpha`    | `false` | 允许 `#rgba` 和 `#rrggbbaa` 格式 |
| `prefixed` | `false` | 显示 `#` 前缀                    |

`HexColorInput` 没有默认样式，可以像普通 `<input>` 一样用 `className`、`placeholder`、`autoFocus` 等。

---

## 8. 样式自定义

`react-colorful` 的样式通过 CSS 变量和 BEM 类名覆盖。

### 8.1 CSS 变量

```css
.react-colorful {
  width: 200px; /* 色板宽度 */
  height: 200px; /* 色板高度 */
}
```

### 8.2 覆盖内部元素

内部结构使用 BEM 命名：

```
.react-colorful
  ├── .react-colorful__saturation   色板区域
  ├── .react-colorful__hue          色相滑块
  ├── .react-colorful__saturation-pointer   色板上的圆点
  └── .react-colorful__hue-pointer          色相滑块上的手柄
```

覆盖示例：

```css
/* 圆角 */
.react-colorful__saturation {
  border-radius: 8px 8px 0 0;
}
.react-colorful__hue {
  border-radius: 0 0 8px 8px;
}

/* 色相手柄改成竖条 */
.react-colorful__hue-pointer {
  width: 6px;
  height: inherit;
  border-radius: 0;
}
```

### 8.3 配合 Tailwind

`react-colorful` 的内部元素没有 `data-slot` 属性，不能直接用 Tailwind 类覆盖。推荐用一层包装 + 全局 CSS：

```tsx
// 用 className 控制外层尺寸
<HexColorPicker className="!h-40 !w-40" color={color} onChange={setColor} />
```

> 注意：`!h-40` 这类 Tailwind 类只能覆盖 `className` 直接作用的根元素（`.react-colorful`），内部子元素的样式仍需用 CSS 文件覆盖。

---

## 9. 进阶用法

### 9.1 Popover 弹出式拾色器

最常见的交互：点一个色块按钮，弹出色板。

```tsx
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

function PopoverColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (c: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="size-8 rounded-md border"
            style={{ backgroundColor: color }}
          />
        }
      />
      <PopoverContent className="w-auto p-3" align="start">
        <HexColorPicker color={color} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}
```

### 9.2 预设色块（Swatches）

`react-colorful` 不自带预设色板，但可以自己用一组按钮实现：

```tsx
const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#64748b",
];

function PresetSwatches({ onSelect }: { onSelect: (color: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="size-5 rounded-md border cursor-pointer"
          style={{ backgroundColor: color }}
          onClick={() => onSelect(color)}
        />
      ))}
    </div>
  );
}
```

### 9.3 组合：色板 + 预设 + 输入框

把三个零件拼成一个完整的颜色选择面板：

```tsx
function ColorPanel({
  color,
  onChange,
}: {
  color: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <HexColorPicker color={color} onChange={onChange} />
      <HexColorInput
        color={color}
        onChange={onChange}
        prefixed
        placeholder="输入 hex"
        className="w-full rounded-md border px-2 py-1 text-sm"
      />
      <PresetSwatches onSelect={onChange} />
    </div>
  );
}
```

---

## 10. TypeScript

类型内置，无需额外安装 `@types`。

每个 picker 对应的色彩类型可以直接 import：

```tsx
import { HslColorPicker, type HslColor } from "react-colorful";

const myHsl: HslColor = { h: 0, s: 0, l: 0 };
```

常用类型：

| 组件              | 对应类型                                                     |
| ----------------- | ------------------------------------------------------------ |
| `RgbColorPicker`  | `RgbColor = { r: number; g: number; b: number }`             |
| `RgbaColorPicker` | `RgbaColor = { r: number; g: number; b: number; a: number }` |
| `HslColorPicker`  | `HslColor = { h: number; s: number; l: number }`             |
| `HsvColorPicker`  | `HsvColor = { h: number; s: number; v: number }`             |

---

## 11. 本项目中的实际接入参考

本项目的文件夹颜色是 `#RRGGBB` 格式（纯 hex，无透明度），对应的 zod schema：

```ts
// src/shared/lib/zod/schemas/folder.ts
export const folderColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, { error: "颜色需为 #RRGGBB 格式" })
  .optional()
  .nullable();
```

接入 `react-colorful` 时只需用 `HexColorPicker`（不要用 `HexAlphaColorPicker`，因为 schema 不接受带 alpha 的 hex）：

```tsx
import { HexColorPicker } from "react-colorful";

<HexColorPicker
  color={folder.color ?? "#64748b"}
  onChange={(color) => update({ color })}
  onChangeEnd={(color) => saveFolder({ color })}
/>;
```

---

## 12. 注意事项

- **SSR 安全**：`react-colorful` 在服务端渲染时不会报错，但色板交互需要客户端环境。如果整块 UI 只在客户端用，配合 `ClientOnly` 组件或 `useMounted` hook。
- **受控组件**：`color` 是受控的，必须配合 state 使用。不要不传 `color` 想做非受控。
- **不要修改内部 DOM**：直接操作 `.react-colorful__saturation` 等内部元素的结构会破坏交互。样式只通过 CSS 覆盖。
- **onChange 频率**：拖拽时 `onChange` 会高频触发。如果回调里有重操作（存库、网络请求），用 `onChangeEnd` 代替。

---

## 13. 参考链接

- [GitHub 仓库](https://github.com/omgovich/react-colorful)
- [在线 Demo](https://omgovich.github.io/react-colorful/)
- [HEX Picker CodeSandbox](https://codesandbox.io/s/react-colorful-demo-u5vwp)
- [RGB Picker CodeSandbox](https://codesandbox.io/s/react-colorful-rgb-o9q0t)
- [样式自定义示例](https://codesandbox.io/s/react-colorful-customization-demo-mq85z)
- [Popover Picker 配方](https://codesandbox.io/s/opmco)
- [预设色块配方](https://codesandbox.io/s/bekry)
