# AI 代理开发指南（monorepo 根）

> 本文件管 **monorepo 全局**：整体结构、turbo 命令、包边界、**跨包通用的代码风格**。
> 各应用/包的专属规范见其目录下的 `AGENTS.md`（如 `apps/web/AGENTS.md`）。

## 概述

本仓库是一个 **pnpm workspace + turborepo** 的 monorepo。

```
ai-spec/
├── apps/
│   └── web/              # Next.js 应用（前端 + HTTP API + 页面渲染）；专属规范见 apps/web/AGENTS.md
│   └── (worker/、realtime/ —— 规划中，阶段 B 起逐步独立成包)
├── packages/             # 共享包占位（阶段 B 抽 @repo/db、@repo/shared、@repo/email）
├── docs/                 # 文档（迁移草稿见 docs/migration-draft/）
└── 根级配置：package.json（workspace 根）/ pnpm-workspace.yaml / turbo.json / docker-compose.yml / prettier.config.mjs
```

> 迁移背景与目标架构见 `docs/migration-draft/monorepo-migration.md`。

## 全局命令（turbo 编排）

在**仓库根目录**运行，turbo 会自动分发到各包的同名脚本：

| 命令             | 说明                                              |
| ---------------- | ------------------------------------------------- |
| `pnpm dev`       | 启动所有 app 的 dev（当前 = apps/web 的 next + worker） |
| `pnpm build`     | 生产构建所有包（按依赖顺序）                      |
| `pnpm lint`      | 所有包 lint                                       |
| `pnpm typecheck` | 所有包类型检查                                    |

> 应用专属命令（如 `apps/web` 的 prisma 脚本）见 `apps/web/AGENTS.md`，从根调用用 `pnpm --filter @repo/web <脚本>`。

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
- 绝不使用 `eslint-disable` 抑制 lint 错误；修复根因。

### 命名

- 类、类型和 React 组件使用 `PascalCase`。
- 函数、变量和对象键使用 `camelCase`。
- 新文件名必须使用 `kebab-case`（中划线分隔的小写），除非已有约定要求其他格式。
- 使用描述性名称；避免在紧凑循环之外使用单字母名称。

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

### Options Object

函数/方法/构造函数满足**任一**条件即用参数对象，禁止位置参数：参数 ≥ 2、含可选参数、含布尔标志、或多个同类型参数。

- 定义具名 `XxxOptions` interface，解构传入；可选字段在解构处给默认值，例如 `constructor({ code, message = "" }: HttpErrorOptions)`。

### 注释规范

- 所有新增或重写的函数、组件、类、导出常量和非平凡逻辑块上方，必须添加一行简短中文单行注释。
- 注释说明这段代码的业务目的或设计意图，不要复述语法。
- import、简单类型声明、简单常量、明显的 JSX 结构不强制添加注释。

示例：

```typescript
// 加载规格详情并处理不存在状态
const loadSpec = async (): Promise<void> => {
  // ...
};

// 渲染规格编辑页面主体
function SpecEditorPage(): React.JSX.Element {
  return <SpecEditor />;
}
```

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
