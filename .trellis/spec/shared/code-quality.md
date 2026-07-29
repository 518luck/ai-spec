# 代码质量硬规则

> 全仓强制规则，与根 `AGENTS.md` 一致。Lint/类型检查用项目脚本，不直接跑底层工具。

## 类型与抑制

- 禁 `any`（用 `unknown` + 收敛或具名类型）。
- 禁非空断言 `!`（用提前返回 / `??` / 类型守卫）。
- 禁 `@ts-ignore` / `@ts-expect-error`（修根因）。
- 禁类型断言 `as`（除 `as const` 等惯用法）；优先 zod 解析或类型守卫。
- 不可变结构用 `readonly` / `as const`。

## 命名

| 对象 | 约定 | 示例 |
| --- | --- | --- |
| 类、类型、React 组件 | PascalCase | `UserService`、`PromptRecord` |
| 函数、变量、对象键 | camelCase | `getUserById` |
| 高阶函数（注入 session/权限/路由等） | `withXxx` | `withSession`、`withPersonal`、`withPermission` |
| 自定义 Hook | `useXxx`，**箭头函数** `const useXxx = () => {}` | `useLoginContext` |
| 非组件函数 | 优先 `const` 箭头函数 | — |
| React 组件 | `function` 声明 | `function LoginPage() {}` |
| 文件名 | kebab-case | `create-token.ts` |
| 常量 | camelCase；真正常量可 SCREAMING_SNAKE_CASE | `MAX_RETRY` |
| 布尔变量 | `is/has/should/can` 前缀 | `isLoading` |

## 控制流与错误处理

- 简洁优先，不写多余防御代码。
- 提前返回 + 正向条件；避免双重否定、德摩根式判断。
- 错误处理只在实际操作处 try/catch；异步逻辑保持线性，避免嵌套 try。
- 能用 `?? ""` 等回退解决类型问题就不要 throw。
- API 尽可能返回有类型的错误（本项目经 `AiSpecError` + `toErrorResponse`）。

## Options Object（参数对象）

函数/方法/构造函数满足**任一**条件即用参数对象，禁位置参数：参数 ≥ 2、含可选参数、含布尔标志、或多个同类型参数。

```ts
interface HttpErrorOptions { code: ErrorCode; message?: string }
class AiSpecError extends Error {
  constructor({ code, message = "" }: HttpErrorOptions) { /* ... */ }
}
```

## 注释规范

- 新增/重写的函数、组件、类、导出常量、非平凡逻辑块上方加**一行简短中文注释**，写"做什么"不写"为什么改"。
- 符号层次标记（`#` `@` `>` `!` `?`）只用于章节标题/重点，不是每条都加；大部分注释保持普通灰色。`#` 文件标题唯一，放 `"use client"`/`"use server"` 指令之后、`import` 之前。
- JSX 内注释用 `{/* // @ 标题 */}` 形式（`/* */` 内带 `//` 才能被 Better Comments 识别）。

## React 事件类型

表单 `onSubmit` 用从 `"react"` 导入的 `SubmitEvent<HTMLFormElement>` / `SubmitEventHandler<HTMLFormElement>`，禁用已弃用的 `FormEvent` / `FormEventHandler`。

## Tailwind v4

引用 CSS 变量的 arbitrary value 用 v4 简写 `prop-(--var)`，不写 `prop-[var(--var)]`；计算表达式（`[calc(...)]`、`[min(...)]`）除外。

## 类组织风格

私有属性最前 → 构造函数 → 公开方法（核心在前、辅助在后）→ 私有方法（`_` 前缀）放最底。

## 验证命令

```bash
pnpm run typecheck   # 类型检查（不直接跑 tsc）
pnpm run lint        # Biome check --write
```

- 绝不用 `biome-ignore` 抑制 lint 错误，修根因。例外：确认是 biome 规则误报（如与 W3C/浏览器标准冲突）才用行内 `// biome-ignore lint/...: <依据>`，理由写明依据。
- 绝不通过删/跳/注释测试使其通过。

## 死代码

移除未用 import、注释掉的代码块、未用变量/函数/类型、`return`/`throw` 后不可达代码。
