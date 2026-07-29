# 后端类型安全

> 通用规则见 `shared/typescript.md`；接口数据类型规则见 `src/shared/lib/zod/AGENTS.md`。

## 校验分层（权威防线在后端）

| 层 | 职责 |
| --- | --- |
| Route Handler / Server Action | **唯一权威防线**：入参用 Dto schema 校验，出参用 Vo schema 校验后再返回 |
| 业务逻辑 | 收到的是已校验类型，专注业务规则（权限、归属、限流等不在 schema 内）|
| 前端 | 提交前预校验（体验层），非权威 |

- 入参 Dto / 出参 Vo 严格分层，不混用。
- 出参**必须**经 Vo 校验后再返回，不直接返回 Prisma 裸对象。

## schema 设计

- 复用基础字段 schema（`emailSchema`/`passwordSchema`），不复制通用规则。
- 输入差异用 `.extend()`/`.pick()`/`.omit()`/`.partial()` 组合，不另起重复定义。
- `trim`、邮箱小写等通用规范化写在 schema，让所有入口自动一致。
- 面向用户的字段错误文案写在 schema，简洁可直接展示。
- schema 只负责形状/格式/长度/基础规则；**不**在 schema 内查库、处理权限/归属/限流。

## schema 边界

`zod/**` 可能被客户端导入，**禁止**引入 Prisma、Redis、NextAuth、`next/headers`、`next/server`、`server-only` 或直接读环境变量。通过 schema 解析获得类型安全，避免 `any` 和不必要断言。

## 类型推断

```ts
// 从 Prisma 推断
type User = Prisma.UserGetPayload<{ select: { id: true; email: true } }>;

// 从 Zod schema 推断（接口类型）
type CreateTokenDto = z.infer<typeof createTokenDtoSchema>;
type TokenVo = z.infer<typeof tokenVoSchema>;
```

## ErrorCode 类型

`ErrorCode` 枚举（`src/shared/lib/zod/schemas/error.ts`）是错误 code 与其类型的**唯一来源**，抛 `AiSpecError` 时用 `ErrorCode.NOT_FOUND` 等，不要用裸字符串。

## 禁止

- `any` / `!` / `@ts-ignore`（见 `shared/code-quality.md`）。
- 循环内 `await` 查询（见 `database.md`）。
- schema 内做服务端业务规则。
