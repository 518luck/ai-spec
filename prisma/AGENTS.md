# Prisma Schema 开发指南

## 适用范围

- `prisma/schema/*.prisma` 下的所有自建 model / enum 定义。
- **第三方库固定表结构**（如 better-auth 的 `Account` / `Session`）**不适用**本规范，保持库原生命名，禁止改名。

## 命名规范

### 字段命名（snake_case）

自建 model 的**所有字段**统一使用 snake_case，包括标量列、外键列、关系字段：

```
✅ owner_id        ✅ created_at       ✅ last_editor_id   ✅ use_count
❌ ownerId         ❌ createdAt        ❌ lastEditorId     ❌ useCount
```

- 单个单词的字段保持全小写，不加下划线（如 `id`、`name`、`content`、`owner`）；只有多个单词组合时才用下划线连接（如 `owner_id`、`created_at`）。
- 关系字段同样使用 snake_case（如 `owner`、`last_editor`）。
- 字段类型沿用 Prisma 原生写法（`String` / `DateTime` / `Int` ...），不随字段名变化。

> 与根 AGENTS.md「对象键使用 camelCase」的关系：Prisma 生成的类型字段为 snake_case，TS 中以**属性访问**形式使用（如 `record.owner_id`），该规则约束的是开发者自定义的对象字面量键名，不约束库生成类型的属性访问，二者不冲突。

### Model 与 Enum 命名

- Model 名、Enum 名：`PascalCase`（`PromptRecord`、`Visibility`）。
- 数据库 schema 按业务域分库：`@@schema("prompt")` / `@@schema("shared")` / `@@schema("auth")` 等。

## 字段排列顺序（强制）

每个 model 自上而下按以下分区排列，**区间用空行分隔**，并保持对齐：

1. **主键** — `id @id`
2. **业务字段** — 核心数据列（`name`、`content`、`visibility` ...）
3. **时间戳** — `created_at`、`updated_at`
4. **外键列** — 存储 id 的标量列（`owner_id`、`last_editor_id`）
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
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  // ④ 外键列
  owner_id        String
  last_editor_id  String?

  // ⑤ 关联关系
  owner        User   @relation("PromptRecordOwner", fields: [owner_id], references: [id], onDelete: Cascade)
  last_editor  User?  @relation("PromptRecordEditor", fields: [last_editor_id], references: [id], onDelete: SetNull)
  versions     PromptRecordVersion[]

  // ⑥ 索引
  @@index([owner_id])
  @@schema("prompt")
}
```

## 字段注释

每个字段后用**行内注释**说明业务用途，帮助团队协作与 AI 理解意图。
