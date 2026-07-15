# Prisma Schema 开发指南

## 适用范围

- `prisma/schema/*.prisma` 下的所有自建 model / enum 定义。
- **第三方库固定表结构**（如 better-auth 的 `Account` / `Session`）**不适用**本规范，保持库原生命名，禁止改名。

## 命名规范

### 字段命名（camelCase + @map）

自建 model 的**所有字段**统一使用 camelCase，与 TS 侧保持一致；DB 列名通过 `@map` 保持 snake_case（历史列名不变，无需数据迁移）。

```
✅ ownerId String @map("owner_id")
✅ createdAt DateTime @default(now()) @map("created_at")
❌ owner_id String
❌ created_at DateTime
```

- 单个单词的字段保持全小写，不加 `@map`（如 `id`、`name`、`content`、`owner`）；只有多个单词组合时才用 camelCase + `@map` 映射到 DB 的 snake_case 列名。
- 关系字段同样使用 camelCase（如 `owner`、`lastEditor`）；**关系字段不加 `@map`**（关系没有对应的 DB 列）。
- `@relation("Name")` 的字符串名称是关系标识，与字段名无关，**改名时不要动它**。
- 字段类型沿用 Prisma 原生写法（`String` / `DateTime` / `Int` ...），不随字段名变化。
- `@@index` / `@@unique` / `@@id` 里引用的字段名跟随 camelCase 改名。

### Model 与 Enum 命名

- Model 名、Enum 名：`PascalCase`（`PromptRecord`、`Visibility`）。
- 数据库 schema 按业务域分库：`@@schema("prompt")` / `@@schema("shared")` / `@@schema("auth")` 等。

## 字段排列顺序（强制）

每个 model 自上而下按以下分区排列，**区间用空行分隔**，并保持对齐：

1. **主键** — `id @id`
2. **业务字段** — 核心数据列（`name`、`content`、`visibility` ...）
3. **时间戳** — `createdAt`、`updatedAt`
4. **外键列** — 存储 id 的标量列（`ownerId`、`lastEditorId`）
5. **关联关系** — `@relation` 字段，随后是反向关系（无 `fields` 的 `@relation`）
6. **索引/约束** — `@@index`、`@@unique`、`@@id`、`@@schema`

### 范例

```prisma
model PromptRecord {
  // ① 主键
  id          String   @id @default(cuid())

  // ② 业务字段
  name        String
  description String?
  content     String   @db.Text
  visibility  Visibility @default(private)

  // ③ 时间戳
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // ④ 外键列
  ownerId         String  @map("owner_id")
  lastEditorId    String? @map("last_editor_id")

  // ⑤ 关联关系
  owner        User   @relation("PromptRecordOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  lastEditor   User?  @relation("PromptRecordEditor", fields: [lastEditorId], references: [id], onDelete: SetNull)
  versions     PromptRecordVersion[]

  // ⑥ 索引
  @@index([ownerId])
  @@schema("prompt")
}
```

## 字段注释

每个字段后用**行内注释**说明业务用途，帮助团队协作与 AI 理解意图。
