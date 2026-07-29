# WebKit 点击高亮与圆角问题（移动端）

## 问题

圆角交互元素（按钮等）在移动端被点击时短暂显示**方角**高亮，而非圆角。仅 WebKit 内核移动浏览器（iOS Safari、iOS 上的 Chrome/Firefox）出现；桌面和 Android Chrome 一般无此问题。

## 根因

WebKit 对交互元素施加默认 tap highlight，该高亮层是**矩形覆盖，忽略 `border-radius`**，且用系统默认半透明蓝/灰色，盖在自定义样式之上。

## 解决

**核心**：交互元素加 `WebkitTapHighlightColor: "transparent"`（或 Tailwind `[-webkit-tap-highlight-color:transparent]`）。圆角元素最稳妥的做法是再套一层同圆角 + `overflow-hidden` 的包裹层裁掉残影。

```tsx
// 简单：禁用高亮
<button
  className="rounded-lg"
  style={{ WebkitTapHighlightColor: "transparent" }}
>
  按钮
</button>

// 最稳：禁用高亮 + overflow-hidden 包裹层裁剪
<div className="overflow-hidden inline-block rounded-lg">
  <button className="rounded-lg" style={{ WebkitTapHighlightColor: "transparent" }}>
    按钮
  </button>
</div>
```

全局可在 base 层统一处理：

```css
@layer base {
  button, a, [role="button"] { -webkit-tap-highlight-color: transparent; }
}
```

## 要点

1. WebKit tap highlight 忽略 `border-radius`，是浏览器行为不是 CSS bug。
2. 圆角交互元素一律设 `WebkitTapHighlightColor: "transparent"`。
3. 最可靠方案：`overflow-hidden` 包裹层 + 禁用高亮。
4. 必须在**真机 iOS** 验证（模拟器/devtools 可能复现不出）。
5. 移除高亮后可加自定义 `:active` 反馈（`opacity`/`scale`）补回触觉反馈。

## 浏览器支持

| 浏览器 | 需修 |
| --- | --- |
| iOS Safari / iOS Chrome / iOS Firefox | 是（WebKit 内核）|
| Android Chrome | 一般否 |
| 桌面浏览器 | 否 |
