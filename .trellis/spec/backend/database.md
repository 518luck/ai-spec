# 数据库（Prisma）

> ORM 是 **Prisma**（`@prisma/client@^7.8.0` + driver adapter），不是 Drizzle。schema 规范权威源：`prisma/AGENTS.md`。

## Prisma Client

- 单例从 `@/shared/db` 导入默认 `prisma`：

```ts
import prisma from "@/shared/db";
import { Prisma } from "@/shared/db/generator/client";

const folders = await prisma.folder.findMany({ where: { ownerId: session.user.id } });
```

- client 由 `prisma-client` generator 生成到 `src/shared/db/generator/`（`prisma/schema/schema.prisma` 的 `generator client { output = "../../src/shared/db/generator" }`）。
- **`src/shared/db/generator/` 严禁手改**，由脚本自动生成。

## schema 工作流（强制）

1. 在 `prisma/schema/*.prisma` 定义/修改 model。
2. `pnpm run prisma:generate` 生成 Prisma Client。
3. 需同步数据库结构时 `pnpm run prisma:migrate`。

## 多 schema

`datasource db` 声明多个 schema（`auth/token/prompt/folder/team/shared/rule/agents/discover`），每个 model 带 `@@schema("域")`：

```prisma
datasource db {
  schemas = ["auth", "token", "prompt", "folder", "team", "shared", "rule", "agents", "discover"]
}
model PromptRecord { /* ... */ @@schema("prompt") }
```

## 命名与字段排列

详见 `prisma/AGENTS.md`，要点：

- 字段 camelCase + `@map("snake_case")`（DB 列名保持 snake_case，无需数据迁移）。单个单词字段不加 `@map`（`id`/`name`/`content`）。关系字段 camelCase 且**不加 `@map`**（关系无对应列）。`@relation("Name")` 字符串是关系标识，改名不动它。
- Model / Enum 用 PascalCase。
- 字段排列分区（空行分隔）：①主键 → ②业务字段 → ③时间戳 → ④外键列 → ⑤关联关系（含反向关系）→ ⑥索引/约束/`@@schema`。
- 每个字段加行内注释说明业务用途。
- **第三方库固定表结构**（如 better-auth 的 `Account`/`Session`）不适用本规范，保持库原生命名，禁止改名。

## 查询模式

### 避免循环内 await（N+1）

```ts
// ❌ N+1
for (const r of records) {
  r.versions = await prisma.version.findMany({ where: { recordId: r.id } });
}

// ✅ 两次查询 + 内存关联
const ids = records.map((r) => r.id);
const versions = await prisma.version.findMany({ where: { recordId: { in: ids } } });
const byRecord = new Map<string, Version[]>();
for (const v of versions) {
  const arr = byRecord.get(v.recordId) ?? [];
  arr.push(v);
  byRecord.set(v.recordId, arr);
}
```

### 批量写

用 `createMany` / `updateMany` / `upsert`，不要循环单条写。

### 事务

`prisma.$transaction(async (tx) => { /* 用 tx 代替 prisma */ })`；抛错自动回滚。

### 类型推断

```ts
type User = Prisma.UserGetPayload<{ select: { id: true; email: true } }>;
// 或整行
type Record = Prisma.PromptRecordGetPayload<{}>;
```

## 并行

独立操作用 `Promise.all`；外部 API 并发控制用 `bottleneck`（项目已装）。详见 `queue.md`。

## 反模式

- 手改 `src/shared/db/generator/`。
- 直接返回 Prisma 裸对象给前端（不经 Vo 校验/转换）。
- 循环内 `await` 查询。
- 不用 `@map` 导致 DB 列名与历史不一致（历史列名不变，无需迁移）。
