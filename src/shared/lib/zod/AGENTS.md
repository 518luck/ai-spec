# Zod Schema 规范

本目录存放跨 Server Action、页面表单和其他入口复用的 Zod schema。新增或修改 schema 时遵循上级 `AGENTS.md` 和 `src/shared/lib/AGENTS.md`。

## 放置规则

- 按业务域拆文件，例如 `schemas/auth.ts`、`schemas/spec.ts`、`schemas/user.ts`。

## 导入策略

- 新文件优先使用 `import * as z from "zod/v4";`。

## 复用与组合

- 优先复用基础字段 schema，不要复制邮箱、密码、验证码等通用规则。
- 表单或 action 输入差异使用 `.extend()`、`.pick()`、`.omit()` 等组合方式表达。
- 客户端表单可以复用共享 schema 搭配 `zodResolver`；服务端 action 仍必须通过 `.inputSchema(schema)` 校验。

## 输入规范化

- `trim`、邮箱小写化等通用规范化应尽量写在 schema 中。
- 面向用户的字段错误文案写在 schema 中，保持简洁、可直接展示。
- schema 负责输入形状、格式、长度和基础规则校验。

## 边界职责

- 不在 schema 中查询数据库或处理权限、资源归属、限流等服务端业务规则。
- `zod/**` 可能被客户端导入，禁止引入 Prisma、Redis、NextAuth、`next/headers`、`next/server`、`server-only` 或直接读取环境变量。
- 通过 schema 解析结果获得类型安全，避免 `any` 和不必要的类型断言。

### 命名规范

类型名为 `[操作动词] + [实体] + 后缀`，实体用单数；列表场景实体用复数。

- **DTO（Data Transfer Object）**：请求入参，承载前端传入并待校验的数据。
- **VO（View Object）**：响应出参，承载返回给前端、按展示需要裁剪后的数据。
- 二者严格分层：**Dto 入 / Vo 出**，请求侧用 `XxxDto`，响应侧用 `XxxVo`，不混用。

- **操作动词**：`Create` / `Update` / `Patch` / `Delete` / `List` / `Get`。
- **实体**：业务名词，如 `User`、`Order`、`PromptDraft`。
- **后缀**：入参 `Dto`，出参 `Vo`。
