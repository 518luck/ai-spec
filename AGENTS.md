# AI 代理开发指南

## 概述

这个并不是你所熟悉的Next.js项目,前端的业务代码都在src下面,后端的代码都在app/api下面

## 项目结构

```
├── app/                   # Next.js App Router 路由层；除 app/api 外应保持薄层，业务实现委托给 src/
│   ├── api/               # 后端入口（API 端点及服务端处理逻辑均在此）
│   └── spec/
├── src/                   # 前端代码（shared/ 同时存放后端基础设施）
│   ├── app/               # 让应用运行起来的一切 — 路由、入口点、全局样式、提供者（providers）。
│   ├── pages/             # 完整页面或嵌套路由中的大块页面内容。
│   ├── widgets/           # 大型独立的功能或 UI 块，通常承载一个完整的用例。
│   ├── shared/            # 可复用的通用功能，特别是在与项目/业务的具体内容解耦时
│   ├── entities/          # 项目所涉及的业务实体，如 user 或 product。
│   └── features/          # 整个产品功能的可复用实现，即能为用户带来业务价值的操作。
├── prisma/                # ORM schema + migrations
└── public/                # 静态资源
```

## 命令

| 命令                       | 说明                             |
| -------------------------- | -------------------------------- |
| `pnpm run prisma:validate` | 验证 schema 语法                 |
| `pnpm run prisma:generate` | 生成 Prisma Client 代码          |
| `pnpm run prisma:migrate`  | 创建并应用数据库迁移（开发环境） |

## shadcn 组件安装

**必须使用 `npx` 安装 shadcn 组件，不要用 `pnpm dlx`。**

```bash
npx shadcn@latest add <component>
```

原因：项目通过 pnpm 安装的 `shadcn` 是带 bug 的旧版（zod 版本冲突导致 `ERR_PACKAGE_PATH_NOT_EXPORTED` 崩溃）。`pnpm dlx` 会复用本地 store 里这个带 bug 的版本，仍然崩溃；而 `npx` 走 npm 的通道，每次拉取最新版（含官方修复），可正常使用。

## 数据库约束

操作数据库时必须遵循以下流程：

1. 在 `prisma/schema/schema.prisma` 中定义或修改 Model
2. 执行 `pnpm run prisma:generate` 生成 Prisma Client 代码
3. 如需同步数据库结构，执行 `pnpm run prisma:migrate`

**禁止手动修改** `src/shared/db/generator/` 下的任何文件，该目录由脚本自动生成。

## 上下文感知加载

根据你正在工作的区域使用对应的 AGENTS.md：

- **Next.js 路由层**（`app/**`，不含 `app/api/**`）→ `app/AGENTS.md`
- **后端**（`app/api/**`）→ `app/api/AGENTS.md`
- **前端业务代码**（`src/**`）→ `src/AGENTS.md`
- **Prisma / 数据库 schema**（`prisma/**`）→ `prisma/AGENTS.md`

### 后端

后端开发模式、安全指南和架构说明，参见 `app/api/AGENTS.md`。

### 前端

前端开发模式、设计系统指南和 React 测试最佳实践，参见 `src/AGENTS.md`。

### 数据库

Prisma schema 命名、字段排列顺序、删除策略与旧表迁移规范，参见 `prisma/AGENTS.md`。

## 代码风格指南

优先遵循目标区域中已有的模式；以下为通用默认规则。

### TypeScript 与类型

- 所有新代码使用 TypeScript；避免使用 `any`。
- 公共 API 和导出函数优先使用显式返回类型。
- 类型专用导入使用 `import type`。
- 除非局部合理，避免非空断言（`!`）。
- 避免使用类型断言（`as`）；优先通过 zod schema 解析、类型守卫或函数签名约束获得类型安全；仅 `as const` 等惯用写法除外。
- 不可变结构优先使用 `readonly` 和 `as const`。
- React 组件必须使用 `function` 声明, 非组件函数应优先使用 `const` 箭头函数，自定义 Hook 视为非组件函数，应使用 `const` 箭头函数。
- 优先使用显式 `import`/`export`，而非 `*`。
- 优先使用变量解构，而非属性访问。
- 绝不使用 `@ts-ignore`、`@ts-expect-error` 抑制类型错误；修复根因。

### React 事件类型

- React 表单提交事件禁止使用已弃用的 `FormEvent` / `FormEventHandler`；`onSubmit` 使用从 `"react"` 导入的 `SubmitEvent<HTMLFormElement>` 或 `SubmitEventHandler<HTMLFormElement>`。

### 类型检查

使用项目脚本进行检查，不直接运行底层工具，除非本文件明确说明。

- 类型检查：`pnpm run typecheck`
- 不要直接运行 `tsc`；使用 `pnpm run typecheck`，以保持和项目脚本一致。

### Lint

- Lint：`pnpm run lint`
- 绝不使用 `biome-ignore` 抑制 lint 错误；修复根因。
- 例外：若确认是 biome 规则误报（如与 W3C/浏览器标准冲突），可用行内 `// biome-ignore lint/...: <具体理由>` 抑制，理由必须写明依据。

### 命名

- 类、类型和 React 组件使用 `PascalCase`。
- 函数、变量和对象键使用 `camelCase`。
- 新文件名必须使用 `kebab-case`（中划线分隔的小写），除非已有约定要求其他格式。
- 使用描述性名称；避免在紧凑循环之外使用单字母名称。
- 高阶函数（接收 handler/component 为主参数，包一层增强后再返回，注入额外上下文如 session、权限、路由、主题等）统一命名为 `withXxx`，例如 `withSession`、`withPermission`。

### 控制流与错误处理

- 简洁优先，不写多余防御代码。
- 优先使用提前返回和正向条件,避免双重否定、德摩根式判断和需要反复脑内取反的表达式。
- 错误处理只在实际操作处用 try/catch；保持异步逻辑线性，尽量避免嵌套的 try 块。
- 能用 || "" 等回退值解决类型问题就不要 throw。
- 显式处理错误；API 尽可能返回有类型的错误。

### React / UI 约定

- 使用函数式组件；显式声明 props 类型。
- 将 hooks 保持在顶层；避免条件式 hooks。
- 除非与文件约定一致，避免内联样式。

### Tailwind CSS

- 引用 CSS 变量的 arbitrary value 用 v4 简写 `prop-(--var)`，不要写 `prop-[var(--var)]`；计算表达式（如 `[calc(...)]`、`[min(...)]`）除外。

### Options Object

函数/方法/构造函数满足**任一**条件即用参数对象，禁止位置参数：参数 ≥ 2、含可选参数、含布尔标志、或多个同类型参数。

- 定义具名 `XxxOptions` interface，解构传入；可选字段在解构处给默认值，例如 `constructor({ code, message = "" }: HttpErrorOptions)`。

### 注释规范

- 所有新增或重写的函数、组件、类、导出常量和非平凡逻辑块上方，必须添加一行简短中文单行注释。
- 注释说明这段代码的业务目的或设计意图，不要复述语法。
- import、简单类型声明、简单常量、明显的 JSX 结构不强制添加注释。

#### 注释层次标记（务必遵循）

符号前缀（`#` `@` `>` `!` `?`）**只用于章节标题和重点标记，不是每条注释都要加**。大部分注释保持普通灰色。

| 符号 | 用途         | 用在哪                                                                               | 频率 |
| ---- | ------------ | ------------------------------------------------------------------------------------ | ---- |
| `#`  | 文件级标题   | 文件首个可执行代码（`"use client"` / `"use server"` 指令除外）之前，整个文件唯一一条 | 极少 |
| `@`  | 章节分组标题 | 把相关的几个常量/函数/类型归为一组时的标题                                           | 少   |
| `>`  | 重点说明     | 需要注意/重要的函数或逻辑，代替普通注释强调                                          | 少   |
| `!`  | 警示         | 坑、危险操作、重要约束、安全相关                                                     | 极少 |
| `?`  | 疑问         | 待确认的逻辑、待讨论的方案                                                           | 极少 |

**`#` 文件标题的位置**：必须放在 `import` 或首个声明之前。若文件开头有 `"use client"` / `"use server"` / `"use strict"` 等指令，`#` 标题写在指令之后、`import` 之前——指令必须是文件第一行。

**核心原则**：符号是"路标"不是"装饰"。一份文件里应该只有少数几个 `#`/`@` 标题，`>` 用于真正需要强调的地方，其余注释保持普通灰色。如果每条注释都带符号，等于没有层次。

### 组件声明顺序

- 默认导出或对外导出的主组件放在文件上方。
- 主组件下方的辅助组件、工具函数，按主组件内从上到下的引用顺序声明。

### 类组织风格

- 私有属性放在最前面，构造函数紧随其后。
- 公开方法放中间，核心功能在前，辅助方法在后。
- 私有方法统一放在类的最底部，使用 `_` 前缀命名。

```typescript
class StorageClient {
  private bucket: string;          // ① 私有属性

  constructor() { ... }            // ② 构造函数

  async upload() { ... }           // ③ 公开方法（核心）
  async getSignedUrl() { ... }     // ③ 公开方法（辅助）

  private _resolveBucket() { ... } // ④ 私有方法（最底部）
}
```

## 验证命令

完成代码修改后，根据变更范围运行相关检查：

- 类型检查：`pnpm run typecheck`
- Lint：`pnpm run lint`

## 贡献规范

- 不确定时：多读代码；仍然无法解决时，提供简短的选项后提问。绝不猜测。
- 修复根因（而非表面修补）。
- 聚焦变更；避免无关重构。
- 行为或用法变更时，同步更新文档和测试。
- 绝不通过删除、跳过或注释掉测试来使其通过；修复底层代码。
