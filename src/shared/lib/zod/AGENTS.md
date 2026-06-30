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

### 类型与 DTO/VO 分层

- 默认用 `z.infer<typeof xxxDtoSchema>` / `z.infer<typeof xxxVoSchema>` 就地推导类型，多数场景无需单独定义类型别名。
- 仅当类型需要被多处引用、导出或参与组合时，才显式定义类型别名，命名与 schema 对应：
  - 入参类型：`[操作动词] + [实体] + Dto`（如 `CreateTokenDto`）。
  - 出参类型：`[实体] + Vo`（如 `TokenVo`）。
- 禁止手写与 schema 重复的接口类型；类型只能由 schema 推导而来。
- 请求入参与响应出参严格分层：**Dto 入 / Vo 出**，不混用。
  - **DTO（Data Transfer Object）**：请求入参，承载前端传入并待校验的数据。
  - **VO（View Object）**：响应出参，承载返回给前端、按展示需要裁剪后的数据。

## 导入策略

- 统一使用 `import * as z from "zod/v4";`，显式锁定 v4 API，避免默认入口随版本漂移，也防止 v3 旧写法混入。

## Schema 设计

### 复用与组合

- 优先复用基础字段 schema（如 `emailSchema`、`passwordSchema`），不要复制邮箱、密码、验证码等通用规则。
- 表单或 action 的输入差异用 `.extend()`、`.pick()`、`.omit()`、`.partial()` 等组合表达，而不是另起一份重复定义。
- 客户端表单可复用共享 schema 搭配 `zodResolver`；服务端 action 仍必须通过 `.inputSchema(schema)` 校验。

### 输入规范化与错误文案

- `trim`、邮箱小写化等通用规范化写在 schema 中，让所有入口自动获得一致行为。
- 面向用户的字段错误文案写在 schema 中，保持简洁、可直接展示。
- schema 只负责输入形状、格式、长度和基础规则校验。

## 边界约束

- 不在 schema 中查询数据库或处理权限、资源归属、限流等服务端业务规则。
- `zod/**` 可能被客户端导入，禁止引入 Prisma、Redis、NextAuth、`next/headers`、`next/server`、`server-only` 或直接读取环境变量。
- 通过 schema 解析结果获得类型安全，避免 `any` 和不必要的类型断言。
