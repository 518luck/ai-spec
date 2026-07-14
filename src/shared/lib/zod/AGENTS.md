# Zod Schema 规范

本目录存放跨 Server Action、页面表单和其他入口复用的 Zod schema。继承上级 `AGENTS.md` 和 `src/shared/lib/AGENTS.md`，仅记录本目录的额外规则。

## 目录结构

- `schemas/`：按业务域拆分 schema 文件。
  - `auth.ts`：登录/注册凭据、邮箱、密码等通用字段。
  - `user.ts`：用户资料相关字段与更新入参。
  - `token.ts`：API 令牌创建入参。
  - `error.ts`：错误码枚举（zod 枚举与 `ErrorCode` 类型的唯一来源）。
- 新增业务域时新建对应文件，文件名用业务域的 kebab-case 单数形式。

## 命名规范

命名是写 schema 的第一件事，先于实现。

### Schema 变量

按用途分两类，命名规则不同：

- **基础字段 schema**：用 `xxxSchema`，不带 Dto/Vo 后缀。
  - 例：`emailSchema`、`passwordSchema`、`userNameSchema`。
- **入参 / 出参 schema**：变量名必须带 `Dto` / `Vo` 后缀，把「数据流向」编码进名字，让任何调用处一眼看出它是请求入还是响应出。
  - 命名公式：`[操作动词] + [实体] + (Dto|Vo) + Schema`。
  - 入参（请求体）用 `Dto`：`createTokenDtoSchema`、`updateUserDtoSchema`。
  - 出参（响应体）用 `Vo`：`tokenVoSchema`、`userVoSchema`。
  - **操作动词**：`Create` / `Update` / `Patch` / `Delete` / `List` / `Get`。
  - **实体**：业务名词单数，如 `User`、`Token`、`PromptDraft`；列表场景用复数。

### 类型别名

- 默认用 `z.infer<typeof xxxSchema>` 就地推导，多数场景无需单独定义类型别名。
- 仅当类型需要被多处引用时才显式导出，命名去掉 `Schema` 后缀：
  - 入参类型：`CreateDraftDto`、`ListDraftsDto`。
  - 出参类型：`DraftVo`、`DraftListVo`。
- **禁止在 UI 组件、API 客户端等处手写与 Dto/Vo 重复的类型**；必须从 schema 派生复用（如 `import type { DraftVo } from "..."`），保证 schema 改字段时全链路自动更新。组件 props、内部状态等非接口类型不受此约束。
- 请求入参与响应出参严格分层：**Dto 入 / Vo 出**，不混用。

### 文件内顺序

每个 schema 文件按三段式组织，从上到下：

1. **导入**：外部依赖。
2. **拼装件**：仅供本文件复用的基础字段 schema（`xxxSchema`，不带 Dto/Vo 后缀），聚在一起。它们是「零件」，第一眼无需关注。
3. **对外导出**：可直接使用的入参/出参 schema（`xxxDtoSchema` / `xxxVoSchema`）及其类型别名，聚在一起。这是文件的公开 API，应一眼可见。

- 拼装件不要 `export`（除非被其他文件复用）；对外只暴露 Dto/Vo schema 与类型。

### 章节标记

「拼装件」段与「对外导出」段上方各加一行 `@` 标题（章节分组标题，定义见根 `AGENTS.md`），一眼定位段落用途：

```ts
// @ 拼装件
emailSchema;
passwordSchema;

// @ 入参
createTokenDtoSchema + CreateDraftDto;
// @ 出参
draftVoSchema + DraftVo;
```

- `@` 是路标，整份文件通常只有几个；不要每条 schema 都加。
- 同段相关的 schema 归在同一个 `@` 下，不再细分。

## 导入策略

- 统一使用 `import * as z from "zod/v4";`。

## Schema 设计

- 优先复用基础字段 schema（如 `emailSchema`、`passwordSchema`），不要复制通用规则。
- 输入差异用 `.extend()`、`.pick()`、`.omit()`、`.partial()` 组合表达，而不是另起一份重复定义。
- `trim`、邮箱小写化等通用规范化写在 schema 中，让所有入口自动获得一致行为。
- 面向用户的字段错误文案写在 schema 中，保持简洁、可直接展示。
- schema 只负责输入形状、格式、长度和基础规则校验。

## 校验分层

- 后端 route handler / server action 是唯一权威防线，必须用 Dto schema 校验。
- 前端 UI 在提交前预校验：React Hook Form 用 `zodResolver`，简单输入用 `safeParse` + toast。
- 前端 API 客户端（`entities/*/api`）只负责传输，不做权威校验，但**入参/出参类型必须从 Dto/Vo schema 派生**，不得手写参数类型或手写替代校验逻辑。

## 边界约束

- 不在 schema 中查询数据库或处理权限、资源归属、限流等服务端业务规则。
- `zod/**` 可能被客户端导入，禁止引入 Prisma、Redis、NextAuth、`next/headers`、`next/server`、`server-only` 或直接读取环境变量。
- 通过 schema 解析结果获得类型安全，避免 `any` 和不必要的类型断言。
