# shadcn/ui Input OTP 使用讲解

`Input OTP` 用来输入一次性验证码、邮箱验证码、短信验证码、PIN 码、2FA/MFA 验证码等短码。shadcn/ui 的 `InputOTP` 组件不是自己从零实现输入行为，而是封装了 [`input-otp`](https://input-otp.rodz.dev/) 这个 React 库。

底层 `input-otp` 的核心设计是：页面上实际只有一个真正的输入框，视觉上的每一格都是根据这个输入框的值渲染出来的 slot。这样既能做成常见的分格验证码 UI，又保留了原生输入框的可访问性、复制粘贴、移动端短信验证码自动填充、键盘操作和屏幕阅读器支持。

本项目当前安装的是 `input-otp@1.4.2`，本地封装位于：

```text
src/shared/ui/input-otp.tsx
```

它导出了 4 个常用组件：

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/shared/ui/input-otp";
```

## 基础使用

### 1. 安装

如果项目里还没有安装依赖，可以安装底层库：

```bash
npm install input-otp
```

在 shadcn/ui 项目里，也可以通过 CLI 添加组件：

```bash
npx shadcn@latest add input-otp
```

当前项目已经安装并封装好了，一般直接从 `@/shared/ui/input-otp` 引入即可。

### 2. 最简单的 6 位验证码

`InputOTP` 是根组件，`maxLength` 决定验证码总长度。每一个 `InputOTPSlot` 通过 `index` 读取对应位置的字符。

```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";

export function VerifyCodeInput() {
  return (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}
```

这里有几个关键点：

- `maxLength={6}` 表示最多输入 6 个字符。
- `InputOTPSlot index={0}` 显示第 1 位，`index={5}` 显示第 6 位。
- slot 的数量最好和 `maxLength` 对齐，否则可能出现输入值存在但没有对应格子显示，或者格子没有值可读。
- 用户真实输入的是底层隐藏输入框，slot 只负责展示字符、焦点态和光标效果。

### 3. 分组和分隔符

很多验证码会显示成 `123-456` 这种格式。可以用两个 `InputOTPGroup` 搭配 `InputOTPSeparator`：

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/shared/ui/input-otp";

export function VerifyCodeWithSeparator() {
  return (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}
```

分隔符只是视觉元素，不会进入最终输入值。用户提交时拿到的仍然是类似 `"123456"` 的字符串。

### 4. 受控用法

当你需要拿到验证码值、展示实时状态、提交给接口、配合表单校验时，使用 `value` 和 `onChange`。

```tsx
"use client";

import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";

export function ControlledVerifyCodeInput() {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-2">
      <InputOTP maxLength={6} value={value} onChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>

      <p className="text-muted-foreground text-sm">
        当前输入：{value || "未输入"}
      </p>
    </div>
  );
}
```

受控用法里，`value` 是唯一数据源。接口提交、按钮禁用、错误提示都应该基于这个值来判断。

### 5. 完成后触发逻辑

底层 `input-otp` 提供 `onComplete`，当输入达到 `maxLength` 时触发。常见用途是自动提交、聚焦提交按钮或触发校验。

```tsx
<InputOTP
  maxLength={6}
  value={value}
  onChange={setValue}
  onComplete={(code) => {
    console.log("验证码输入完成：", code);
  }}
>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>
```

注意：`onComplete` 只代表“长度满了”，不代表验证码一定正确。真正的验证仍然要交给后端或表单逻辑。

## 组件结构

推荐的组合关系是：

```text
InputOTP
├── InputOTPGroup
│   ├── InputOTPSlot
│   ├── InputOTPSlot
│   └── InputOTPSlot
├── InputOTPSeparator
└── InputOTPGroup
    ├── InputOTPSlot
    ├── InputOTPSlot
    └── InputOTPSlot
```

### `InputOTP`

根组件，负责管理真实输入框、输入值、粘贴、移动端键盘、自动填充、焦点和上下文数据。

在本项目封装中，它会自动加上：

```tsx
containerClassName="cn-input-otp flex items-center has-disabled:opacity-50"
spellCheck={false}
className="disabled:cursor-not-allowed"
```

你可以继续传入 `className` 和 `containerClassName` 扩展样式。

### `InputOTPGroup`

视觉分组容器，本质是一个 `div`。它通常包裹一组连续 slot，例如前三位或后四位。

本项目封装里，它处理了圆角、边框、错误态相关样式：

```tsx
<InputOTPGroup>
  <InputOTPSlot index={0} />
  <InputOTPSlot index={1} />
  <InputOTPSlot index={2} />
</InputOTPGroup>
```

### `InputOTPSlot`

单个字符展示格。必须传 `index`。

```tsx
<InputOTPSlot index={0} />
```

它通过 `OTPInputContext` 读取：

- `char`：当前格子的字符。
- `isActive`：当前格是否处于激活态。
- `hasFakeCaret`：是否显示模拟光标。

所以不要把它当作独立输入框使用，它必须放在 `InputOTP` 内部。

### `InputOTPSeparator`

视觉分隔符。本项目里默认渲染 `MinusIcon`，并带有 `role="separator"`。

```tsx
<InputOTPSeparator />
```

它不参与输入值，只负责把验证码显示成更容易阅读的结构。

## 常见 API

### `maxLength`

验证码最大长度，必填。

```tsx
<InputOTP maxLength={6}>...</InputOTP>
```

常见取值：

- `4`：PIN 码、短验证码。
- `6`：短信/邮箱验证码最常见。
- `8`：备份码、恢复码或更长安全码。

### `value` 和 `onChange`

控制输入值。

```tsx
const [value, setValue] = useState("")

<InputOTP maxLength={6} value={value} onChange={setValue}>
  ...
</InputOTP>
```

适合：

- 需要展示当前输入值。
- 需要禁用提交按钮直到输入完成。
- 需要接入 React Hook Form、Zod 或接口请求。
- 输入错误后需要清空或重置。

### `defaultValue`

非受控默认值。因为 `InputOTP` 继承了常见 input 属性，所以可以像普通 input 一样传。

```tsx
<InputOTP maxLength={6} defaultValue="123456">
  ...
</InputOTP>
```

如果后续需要主动清空、重置、校验，优先使用受控写法。

### `onComplete`

输入长度达到 `maxLength` 时触发。

```tsx
<InputOTP
  maxLength={6}
  onComplete={(code) => {
    verifyCode(code);
  }}
>
  ...
</InputOTP>
```

适合自动提交，但要谨慎处理：

- 避免重复请求，可以加 loading 状态。
- 失败后通常要保留输入值并显示错误，或者按业务需要清空。
- 不要只依赖前端长度判断，后端仍要验证验证码是否正确、是否过期、是否尝试次数超限。

### `pattern`

限制允许输入的字符。`input-otp` 提供了几个常用正则常量：

```tsx
import {
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from "input-otp";
```

只允许数字：

```tsx
<InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS}>
  ...
</InputOTP>
```

只允许英文字母：

```tsx
<InputOTP maxLength={6} pattern={REGEXP_ONLY_CHARS}>
  ...
</InputOTP>
```

允许数字和英文字母：

```tsx
<InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
  ...
</InputOTP>
```

你也可以传自定义正则字符串：

```tsx
<InputOTP maxLength={6} pattern="^[A-Z0-9]+$">
  ...
</InputOTP>
```

注意：如果业务只发数字验证码，建议显式使用 `REGEXP_ONLY_DIGITS`，不要让用户输入字母后再报错。

### `pasteTransformer`

处理粘贴内容。比如用户复制的是 `123-456`，但你的输入只接受 6 位数字，就可以先去掉中划线。

```tsx
<InputOTP
  maxLength={6}
  pattern={REGEXP_ONLY_DIGITS}
  pasteTransformer={(pasted) => pasted.replaceAll("-", "")}
>
  ...
</InputOTP>
```

常见处理：

- 去掉空格：`pasted.replaceAll(" ", "")`
- 去掉中划线：`pasted.replaceAll("-", "")`
- 统一大写：`pasted.toUpperCase()`
- 从短信文本中提取数字：`pasted.replace(/\D/g, "")`

如果你同时使用 `pattern`，要确保转换后的字符串满足 pattern，否则粘贴内容仍可能被拒绝。

### `disabled`

禁用输入。

```tsx
<InputOTP maxLength={6} disabled>
  ...
</InputOTP>
```

本项目封装会让禁用状态下的容器透明度降低，并让输入框显示不可操作的 cursor。

常见场景：

- 正在提交验证码。
- 验证码已过期。
- 等待重新发送。
- 表单整体被禁用。

### `aria-invalid`

标记错误状态。shadcn 文档推荐把 `aria-invalid` 放到 slot 上，本项目样式也针对 `aria-invalid` 做了错误边框和 ring。

```tsx
<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} aria-invalid />
    <InputOTPSlot index={1} aria-invalid />
    <InputOTPSlot index={2} aria-invalid />
    <InputOTPSlot index={3} aria-invalid />
    <InputOTPSlot index={4} aria-invalid />
    <InputOTPSlot index={5} aria-invalid />
  </InputOTPGroup>
</InputOTP>
```

实际项目中通常会根据错误状态统一传：

```tsx
const invalid = Boolean(error)

<InputOTPSlot index={0} aria-invalid={invalid} />
```

### `inputMode`

控制移动端虚拟键盘类型。底层默认适合数字验证码，但你可以按业务调整。

```tsx
<InputOTP maxLength={6} inputMode="numeric">
  ...
</InputOTP>
```

常见选择：

- `numeric`：数字验证码、PIN。
- `text`：字母或字母数字混合验证码。
- `tel`：类似电话键盘的输入体验。

如果使用字母数字混合验证码，记得把 `inputMode` 改成 `text`，否则移动端用户可能不方便输入字母。

### `autoFocus`

页面加载或组件出现后自动聚焦。

```tsx
<InputOTP maxLength={6} autoFocus>
  ...
</InputOTP>
```

适合验证码页这种单一任务页面。复杂表单中不要滥用，避免页面一打开就抢焦点。

### `name`

因为底层是一个真实 input，所以可以像普通表单字段一样设置 `name`。

```tsx
<form action="/verify" method="post">
  <InputOTP maxLength={6} name="otp">
    ...
  </InputOTP>
  <button type="submit">验证</button>
</form>
```

提交时字段值就是完整验证码字符串。

### `containerClassName` 和 `className`

这两个样式入口容易混淆：

- `containerClassName`：作用在外层容器，也就是包住隐藏 input 和 slots 的根容器。
- `className`：作用在真实 input 上。

常见情况下，布局间距、整体对齐放 `containerClassName`：

```tsx
<InputOTP maxLength={6} containerClassName="justify-center">
  ...
</InputOTP>
```

如果你遇到真实 input 的 focus 样式干扰，再考虑通过 `className` 调整：

```tsx
<InputOTP maxLength={6} className="focus-visible:ring-0">
  ...
</InputOTP>
```

### `pushPasswordManagerStrategy`

底层 `input-otp` 默认会处理密码管理器插件的徽标，避免 LastPass、1Password、Dashlane、Bitwarden 等插件的小图标压到最后一个 slot 上。

默认策略是增加一点输入区域宽度，把徽标推到右侧。如果你想关闭这个策略：

```tsx
<InputOTP maxLength={6} pushPasswordManagerStrategy="none">
  ...
</InputOTP>
```

关闭后，如果仍想屏蔽某些密码管理器，可以按对应插件要求补充属性，例如：

```tsx
<InputOTP
  maxLength={6}
  pushPasswordManagerStrategy="none"
  data-lpignore="true"
  data-1p-ignore="true"
>
  ...
</InputOTP>
```

### `textAlign`

控制真实输入框内部文本对齐方式：

```tsx
<InputOTP maxLength={6} textAlign="left">
  ...
</InputOTP>
```

可选值：

- `left`
- `center`
- `right`

官方文档不推荐随意改成居中或右对齐，因为这会影响触摸、长按、选区和光标位置的体验。通常保持默认即可。

### `placeholder`

底层支持 `placeholder`，并会在 slot 数据里提供 `placeholderChar`。如果你直接使用原始 `OTPInput` 的 `render` 写法，可以渲染 placeholder 字符。

当前项目的 `InputOTPSlot` 只渲染了 `char` 和模拟光标，没有渲染 `placeholderChar`。所以如果你需要每格显示占位字符，需要调整本地 `src/shared/ui/input-otp.tsx` 的 slot 实现。

### `noScriptCSSFallback`

当页面没有 JS 时，底层库可以注入一段 CSS，让真实 input 至少以可用的普通输入框形式出现。

```tsx
<InputOTP maxLength={6} noScriptCSSFallback={null}>
  ...
</InputOTP>
```

不建议关闭，除非你明确知道无 JS 场景不需要支持，或者你要提供自己的 fallback 样式。

## 常见场景

### 4 位数字 PIN

```tsx
import { REGEXP_ONLY_DIGITS } from "input-otp";

<InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
  </InputOTPGroup>
</InputOTP>;
```

### 6 位邮箱/短信验证码

```tsx
import { REGEXP_ONLY_DIGITS } from "input-otp";

<InputOTP
  maxLength={6}
  pattern={REGEXP_ONLY_DIGITS}
  value={code}
  onChange={setCode}
>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>;
```

### 字母数字混合恢复码

```tsx
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

<InputOTP
  maxLength={8}
  inputMode="text"
  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
  pasteTransformer={(pasted) => pasted.replaceAll("-", "").toUpperCase()}
>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
    <InputOTPSlot index={6} />
    <InputOTPSlot index={7} />
  </InputOTPGroup>
</InputOTP>;
```

### React Hook Form

可以像普通 input 一样接入。简单场景可以直接 `register`：

```tsx
const form = useForm<{ otp: string }>()

<InputOTP maxLength={6} {...form.register("otp")}>
  ...
</InputOTP>
```

如果你要更精确地控制错误态、值变化和 UI，可以使用 `Controller`：

```tsx
<Controller
  name="otp"
  control={form.control}
  render={({ field, fieldState }) => (
    <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
      <InputOTPGroup>
        {Array.from({ length: 6 }).map((_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            aria-invalid={fieldState.invalid}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )}
/>
```

### 自动提交

```tsx
const [isSubmitting, setIsSubmitting] = useState(false)

<InputOTP
  maxLength={6}
  disabled={isSubmitting}
  onComplete={async (code) => {
    setIsSubmitting(true)
    try {
      await verifyCode(code)
    } finally {
      setIsSubmitting(false)
    }
  }}
>
  ...
</InputOTP>
```

自动提交时一定要处理 loading 和重复触发问题。否则用户粘贴验证码或快速修改时，可能产生多次请求。

## 使用技巧与注意事项

### 1. `maxLength`、slot 数量和 `index` 要一致

这是最容易出错的地方。

如果 `maxLength={6}`，通常就需要 6 个 slot，index 从 `0` 到 `5`。不要从 `1` 开始写，也不要漏写中间某一位。

正确：

```tsx
<InputOTPSlot index={0} />
<InputOTPSlot index={1} />
<InputOTPSlot index={2} />
<InputOTPSlot index={3} />
<InputOTPSlot index={4} />
<InputOTPSlot index={5} />
```

错误：

```tsx
<InputOTPSlot index={1} />
<InputOTPSlot index={2} />
<InputOTPSlot index={3} />
<InputOTPSlot index={4} />
<InputOTPSlot index={5} />
<InputOTPSlot index={6} />
```

### 2. 优先让验证码输入成为受控组件

验证码通常会参与以下逻辑：

- 输入满 6 位才能提交。
- 请求中禁用输入。
- 后端返回错误后展示错误态。
- 重新发送验证码后清空旧值。

这些都更适合用 `value` 和 `onChange` 管理。

### 3. 数字验证码要配合 `pattern`

只设置 `maxLength={6}` 只是限制长度，不代表只能输入数字。数字验证码建议这样写：

```tsx
<InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS}>
  ...
</InputOTP>
```

这样用户输入字母时会直接被限制，体验比提交后再报错更好。

### 4. 字母数字验证码要考虑移动端键盘

如果验证码包含字母：

```tsx
<InputOTP maxLength={6} inputMode="text" pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
  ...
</InputOTP>
```

否则移动端如果弹出数字键盘，用户输入字母会很困难。

### 5. 粘贴体验很重要

验证码经常来自短信、邮件、Authenticator 或客服系统，用户复制的内容可能带空格、中划线或说明文字。

可以通过 `pasteTransformer` 做清洗：

```tsx
pasteTransformer={(pasted) => pasted.replace(/\D/g, "")}
```

对于纯数字验证码，这样可以从 `Your code is 123-456` 里提取出 `123456`。

### 6. 不要把 `InputOTPSlot` 当成 input

每个 slot 只是展示格，不是真实输入框。不要给每个 slot 单独绑定 `value`、`onChange` 或表单字段名。

正确的数据入口是根组件：

```tsx
<InputOTP value={value} onChange={setValue} maxLength={6}>
  ...
</InputOTP>
```

### 7. 错误态应该和可访问性一起处理

视觉上可以给 slot 设置 `aria-invalid`，同时应该在附近展示错误消息。

```tsx
<InputOTP maxLength={6} aria-describedby="otp-error">
  ...
</InputOTP>;
{
  error ? (
    <p id="otp-error" className="text-destructive text-sm">
      {error}
    </p>
  ) : null;
}
```

这样既有视觉错误态，也能让辅助技术知道错误说明在哪里。

### 8. 自动提交不要绕过后端安全

`onComplete` 只能说明用户输入了足够长度的字符串。实际业务仍然要在服务端检查：

- 验证码是否正确。
- 验证码是否过期。
- 验证码是否已使用。
- 尝试次数是否超限。
- 当前用户、邮箱或手机号是否匹配。

前端不要把验证码正确性判断写死在 UI 里。

### 9. 注意密码管理器徽标

底层库默认会把密码管理器徽标推离最后一个 slot。通常不要关闭。

只有当你的页面有特殊布局，或你要自己处理密码管理器属性时，再使用：

```tsx
pushPasswordManagerStrategy = "none";
```

### 10. Next.js / React Server Components 中要放在客户端组件里

`InputOTP` 需要响应用户输入，使用 `useState`、`onChange`、`onComplete` 等交互逻辑时，组件文件顶部需要：

```tsx
"use client";
```

如果只是从服务端组件中引用，也应把验证码输入区域拆到客户端组件中。

### 11. RTL 支持

shadcn 文档提到 RTL 场景可以通过全局 RTL 配置支持。验证码位数和 index 仍然按照数据顺序写，视觉方向交给布局和 direction 处理。

```tsx
<div dir="rtl">
  <InputOTP maxLength={6}>...</InputOTP>
</div>
```

### 12. 样式扩展建议

常见扩展位置：

- 整体居中：传给 `InputOTP` 的 `containerClassName`。
- 单格尺寸：传给 `InputOTPSlot` 的 `className`。
- 错误态：传 `aria-invalid` 到 slot。
- 分组间距：调整 `InputOTPSeparator` 或 group 外层布局。

示例：

```tsx
<InputOTP maxLength={6} containerClassName="justify-center">
  <InputOTPGroup>
    {Array.from({ length: 6 }).map((_, index) => (
      <InputOTPSlot key={index} index={index} className="size-10 text-base" />
    ))}
  </InputOTPGroup>
</InputOTP>
```

### 13. 原始库的 `render` 写法和 shadcn 写法的区别

官方 `input-otp` 文档主要展示的是原始库写法：

```tsx
import { OTPInput } from "input-otp";

<OTPInput
  maxLength={6}
  render={({ slots }) => (
    <div>
      {slots.map((slot, index) => (
        <Slot key={index} {...slot} />
      ))}
    </div>
  )}
/>;
```

shadcn/ui 为了更符合组件组合习惯，把 slot 渲染封装成：

```tsx
<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>
```

两者底层能力相同。项目里优先使用 shadcn 封装，除非你要完全自定义 slot 渲染逻辑。

## 推荐模板

下面是一个比较完整、适合业务使用的模板：

```tsx
"use client";

import { useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";

type VerifyOtpFieldProps = {
  error?: string;
  disabled?: boolean;
  onComplete?: (code: string) => void;
};

export function VerifyOtpField({
  error,
  disabled,
  onComplete,
}: VerifyOtpFieldProps) {
  const [value, setValue] = useState("");
  const invalid = Boolean(error);

  return (
    <div className="space-y-2">
      <InputOTP
        maxLength={6}
        value={value}
        onChange={setValue}
        onComplete={onComplete}
        pattern={REGEXP_ONLY_DIGITS}
        disabled={disabled}
        aria-describedby={invalid ? "otp-error" : undefined}
        containerClassName="justify-center"
      >
        <InputOTPGroup>
          {Array.from({ length: 6 }).map((_, index) => (
            <InputOTPSlot key={index} index={index} aria-invalid={invalid} />
          ))}
        </InputOTPGroup>
      </InputOTP>

      {invalid ? (
        <p id="otp-error" className="text-destructive text-center text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

## 资料来源

- shadcn/ui Input OTP 文档：安装、组合结构、pattern、disabled、controlled、invalid、form、RTL 等示例。
- `input-otp` 官方站点：https://input-otp.rodz.dev/
- `input-otp` GitHub README：https://github.com/guilhermerodz/input-otp
- 本项目封装：`src/shared/ui/input-otp.tsx`
