# ai-spec RBAC 资源设计 v2

> **状态**：草案 v2.1（已纳入三态用户模型）
> **替代**：`src/shared/lib/api/rbac/`（v1，孤儿代码，零引用）
> **参考**：Dub（dub.co）的"工作空间隔离"模式 —— `apps/web/lib/auth/workspace.ts` + `getXxxForWorkspace`
> **产品依据**：[`项目设计2.0.md`](./项目设计2.0.md) 第 432-650 行（权限模型、资源清单、迁移规划）

### 修订记录

| 版本         | 变更                                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v2.0         | 初版：基于 Dub 模式，三类资源（A/B/C）+ 两道闸门 + Prompt 样板                                                                                                                                                |
| v2.1（本版） | **修正与 Dub 的关键差异**：① 新增"游客"为独立用户形态；② 明确"团队 = 工作空间"（非嵌套）；③ 新增"第零道闸"处理游客只读访问；④ 新增 §4.4"分享到团队"动作；⑤ 命名从 `Workspace` 统一改为 `Team`，更贴近产品语义 |

---

## 0. 设计目标

1. **支持三种用户形态**（与 Dub 的关键差异）：
   - **游客**（未登录）→ 只读访问 discover 广场 + 部分公开资源 + 部分设置
   - **个人用户**（已登录，未加入团队）→ 拥有个人空间，资源挂在 `ownerId` 下
   - **团队成员**（已登录 + 是某团队成员）→ 可访问团队下的项目与资源
2. **抛弃 v1** 的"全局角色 + 资源 action"模型，改用 Dub 风格的**团队级隔离**。
3. **三道闸门**（在 Dub 两道闸基础上增加"第零道"处理游客）：
   - 第零道闸：**判游客**（有没有登录？没登录允许做什么？）
   - 第一道闸：**判成员**（你在这个团队吗？什么角色？）
   - 第二道闸：**取数据**（`WHERE teamId = ?`，不再判权限）
4. **资源双态归属**（不是 Dub 的三态 visibility，而是"个人 / 团队"两态 + 可选公开）：
   - 个人资源：`ownerId = userId, teamId = null`
   - 团队资源：`ownerId = null, teamId = teamId`
   - 跨态转换：通过显式的"分享到团队"动作（§4.4）
5. **本轮范围**：仅落地 A 类团队级资源 + Prompt 一个 B 类样板；旧的 `rbac/` 目录保留不动。

---

## 1. 核心模型：三态用户 × 三道闸门

### 1.1 三态用户

| 形态         | 判定条件                              | 可访问区域                                     | 数据归属                          |
| ------------ | ------------------------------------- | ---------------------------------------------- | --------------------------------- |
| **游客**     | `withSession` 失败                    | discover 广场 + public 资源 + 部分设置（只读） | 无（无 `userId`）                 |
| **个人用户** | 已登录 + `teamMemberships = []`       | 个人空间 + discover + 设置                     | `ownerId = userId, teamId = null` |
| **团队成员** | 已登录 + `teamMemberships.length > 0` | 个人空间 + 团队空间 + discover + 设置          | 个人资源 + 团队资源               |

### 1.2 三道闸门流程

```
             请求进来
                │
                ▼
┌──────── 第零道闸 withOptionalSession ─────────┐
│  解 cookie/api-key，尝试拿 session            │
│  ┌─ 拿不到 → ctx.user = null（游客模式）       │
│  └─ 拿到   → ctx.user = session.user           │
└───────────────────┬───────────────────────────┘
                    ▼
       ┌── 路由性质判断 ──┐
       │                  │
public/anon 路由        受保护路由（team/* 等）
       │                  │
       ▼                  ▼
只允许读 +         ┌─ 第一道闸 withTeam ──┐
ctx.user=null      │  ctx.user 必须存在    │
时禁写             │  → 否则 401           │
                   │  查 TeamMember：     │
                   │  where: {userId, teamId} │
                   │  → 不存在 404         │
                   │  → role 不够 403      │
                   └──────────┬────────────┘
                              ▼
                   ┌─ 第二道闸 getXxxForTeam ─┐
                   │  WHERE teamId = ?         │
                   │  纯取数，不再判权限        │
                   └───────────────────────────┘
```

### 1.3 与 Dub 模式的差异（关键）

| 维度         | Dub                               | ai-spec（本设计）                                 |
| ------------ | --------------------------------- | ------------------------------------------------- |
| 用户形态     | 登录用户 + 工作空间成员（无游客） | **三态：游客 / 个人 / 团队成员**                  |
| 闸门数量     | 两道                              | **三道**（多一个游客判定）                        |
| 资源归属     | 一切资源都属于某个 workspace      | **双态：个人资源（ownerId）+ 团队资源（teamId）** |
| 资源跨态转换 | 不存在（资源永远在 workspace 内） | **显式"分享到团队"动作**（§4.4）                  |
| 工作空间嵌套 | 扁平 workspace + project          | 同 Dub：**Team + TeamProject 两层扁平**（不嵌套） |
| 团队命名     | UI 叫 workspace                   | UI 叫"**团队**"（用户也可叫公司/部门，名字任意）  |

---

## 2. 完整资源清单

### 2.1 A 类：团队级资源

> 第一道闸（`withTeam`）通过后，第二道闸用 `WHERE teamId = ?` 直接取数。

| 资源               | 关键字段                       | 说明                                                     | 本轮   |
| ------------------ | ------------------------------ | -------------------------------------------------------- | ------ |
| `Team`             | id, slug, name, ownerId        | **团队本身**（= Dub 的 Workspace）                       | ✅     |
| `TeamMember`       | id, teamId, userId, role       | **第一道闸要查的表**                                     | ✅     |
| `TeamProject`      | id, teamId, name               | 项目归属于团队（"UI 部门"、"动画部门" 都是 TeamProject） | ✅     |
| `SharedAsset`      | id, teamId, type, content      | 团队级共享资产                                           | ⏸ 下轮 |
| `ActivityLog`      | id, teamId, userId, action, ts | 审计日志                                                 | ⏸      |
| `ApiKeyCredential` | id, teamId, hashedKey          | 团队级 API Key                                           | ⏸      |
| `McpConnection`    | id, teamId, ...                | MCP 连接配置                                             | ⏸      |
| `Favorite`         | id, userId, assetId            | 收藏                                                     | ⏸      |
| `Tag` / `Category` | id, teamId, name               | 团队内分类体系                                           | ⏸      |

### 2.2 B 类：双态资源（个人 / 团队 + 可选公开）

| 资源           | 个人态                            | 团队态                       | 公开态（discover）                      | 本轮    |
| -------------- | --------------------------------- | ---------------------------- | --------------------------------------- | ------- |
| **Prompt**     | `ownerId = userId, teamId = null` | `ownerId = null, teamId = ?` | 任意态 + `visibility=PUBLIC` 都可上广场 | ✅ 样板 |
| RuleSpec       | 同上                              | 同上                         | 同上                                    | ⏸ 下轮  |
| AgentsDocument | 同上                              | 同上                         | 同上                                    | ⏸       |
| Skill          | 同上                              | 同上                         | 同上                                    | ⏸       |
| Agent          | 同上                              | 同上                         | 同上                                    | ⏸       |
| Plugin         | 同上                              | 同上                         | 同上                                    | ⏸       |

**B 类资源的标准字段：**

```
id, ownerId, teamId, projectId, visibility, ...
```

- `ownerId` 和 `teamId` **互斥**（由 `@@check` 约束保证）
- `visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC'`
  - `PRIVATE`：仅自己可见（personal 视图）
  - `TEAM`：团队成员可见（team 视图）
  - `PUBLIC`：上 discover 广场（discover 视图）
- `projectId` 可选：归到团队下某个具体项目（部门）里

### 2.3 C 类：资源级 ACL（本轮不做）

- "某一个 Prompt 只给某个成员编辑" → 需要独立的 `AssetAcl` 表
- 产品设计 2.0.md:653 已列在 P1，本轮引入会过度设计

---

## 3. 角色与权限矩阵

### 3.1 用户形态与角色定义

> **两层概念，不要混淆**：
>
> - **形态**（form）：游客 / 个人 / 团队成员 —— 描述"你当前登录状态"
> - **角色**（role）：OWNER / ADMIN / EDITOR / VIEWER —— 描述"你在某个团队里担任什么"

| 形态     | 角色     | 说明                                           |
| -------- | -------- | ---------------------------------------------- |
| 游客     | —        | 无角色；只能读，不能写                         |
| 个人用户 | —        | 无角色（没加入任何团队）；能读写自己的个人资源 |
| 团队成员 | `OWNER`  | 团队创建者；唯一能删团队 / 转让所有权          |
| 团队成员 | `ADMIN`  | 管成员、管团队设置；不能动 OWNER               |
| 团队成员 | `EDITOR` | 读写团队内所有资源；不能管成员 / 设置          |
| 团队成员 | `VIEWER` | 只读                                           |

> **关键**：`role` 字段挂在 `TeamMember.role` 上，**不是 `User.role`**。同一人在 A 团队是 OWNER，在 B 团队可以是 VIEWER。

### 3.2 权限矩阵（含游客列）

| Action                                     | 游客                   | 个人         | OWNER | ADMIN        | EDITOR | VIEWER |
| ------------------------------------------ | ---------------------- | ------------ | ----- | ------------ | ------ | ------ |
| `discover.read`                            | ✅                     | ✅           | ✅    | ✅           | ✅     | ✅     |
| `personal.demo.read`（游客看的"个人空间"） | ✅（只读 public 聚合） | —            | —     | —            | —      | —      |
| `personal.*.read`                          | ❌                     | ✅（仅自己） | ✅    | ✅           | ✅     | ✅     |
| `personal.*.write`                         | ❌                     | ✅（仅自己） | ✅    | ✅           | ✅     | ❌     |
| `team.*.read`                              | ❌                     | ❌           | ✅    | ✅           | ✅     | ✅     |
| `team.*.write`                             | ❌                     | ❌           | ✅    | ✅           | ✅     | ❌     |
| `team.delete`                              | ❌                     | ❌           | ✅    | ❌           | ❌     | ❌     |
| `team.transfer`                            | ❌                     | ❌           | ✅    | ❌           | ❌     | ❌     |
| `member.invite`                            | ❌                     | ❌           | ✅    | ✅           | ❌     | ❌     |
| `member.remove`                            | ❌                     | ❌           | ✅    | ✅           | ❌     | ❌     |
| `member.updateRole`                        | ❌                     | ❌           | ✅    | ✅（仅更低） | ❌     | ❌     |
| `team.settings`                            | ❌                     | ❌           | ✅    | ✅           | ❌     | ❌     |
| `apiKey.manage`                            | ❌                     | ❌           | ✅    | ✅           | ❌     | ❌     |
| `settings.preferences.read`                | ✅（部分）             | ✅           | ✅    | ✅           | ✅     | ✅     |
| `settings.preferences.write`               | ❌                     | ✅           | ✅    | ✅           | ✅     | ✅     |

**判定方式**：参考 Dub，把矩阵编码成纯函数 `can(user, action, ctx?)`，不查库（角色信息已在第一道闸拿到）。

---

## 4. 三道闸门实现方案

### 4.0 第零道闸：`withOptionalSession`（新增）

**目的**：Dub 的 `withSession` 一旦拿不到 session 就直接 401，但本项目的游客**需要匿名访问部分路由**（discover、部分 personal demo、部分 settings）。因此需要一个"软"的 session 解析器。

**位置**：`src/shared/lib/auth/with-optional-session.ts`（新建）

**职责**：

```
withOptionalSession(handler, { allowAnonymous? })
  ↓
1. 尝试解 cookie/api-key（复用 withSession 的解 token 逻辑）
2. 拿到 → ctx.user = session.user
3. 拿不到：
   - allowAnonymous = true → ctx.user = null（继续，handler 自己判）
   - allowAnonymous = false → 401
```

**与现有 `withSession` 的关系**：

- `withSession` = `withOptionalSession({ allowAnonymous: false })` 的快捷方式
- 现有 `withSession`（with-session.ts:111）保持不变，受保护路由继续用它
- 新增 `withOptionalSession` 用于 discover/匿名可读的端点

### 4.1 第一道闸：`withTeam`

**位置**：`src/shared/lib/auth/with-team.ts`（新建）

**职责**：

```
withTeam(handler, { requiredRole?, paramKey? })
  ↓
1. 调 withSession 拿到 ctx.user（游客在这里直接 401）
   （复用现有逻辑：src/shared/lib/auth/with-session.ts:111）
2. 从 req.params[paramKey ?? 'teamId'] 或 slug 提取 team 标识
3. 查 TeamMember（include Team）：
     where: { userId, teamId }
4. 不存在 → 404 not_found
   （不暴露团队存在性，沿用 Dub 风格：apps/web/lib/auth/workspace.ts:387）
5. requiredRole 检查 → 不够 → 403 forbidden
6. 注入 ctx.team + ctx.member 给 handler
```

**与 Dub 的对应**：

| ai-spec（本设计）     | Dub              | 说明         |
| --------------------- | ---------------- | ------------ |
| `withTeam`            | `withWorkspace`  | 第一道闸     |
| `withSession`（已有） | `getSession`     | 取登录态     |
| `TeamMember` 表       | `ProjectUser` 表 | 成员关系     |
| `not_found` 错误      | `not_found` 错误 | 不暴露存在性 |

### 4.2 第二道闸：`getXxxForTeam` 命名约定

所有 A 类资源的取数函数**强制签名**：

```ts
getProjectsForTeam({ teamId, ... })
getSharedAssetsForTeam({ teamId, ... })
getActivityLogsForTeam({ teamId, ... })
getMembersForTeam({ teamId, ... })
```

**约束**：

- 函数体内**第一行就是** `WHERE teamId = ?`
- 禁止接受 `userId` 作为过滤条件（避免回到硬编码 `session.user.id` 模式）
- B 类双态资源用三个函数区分视图：`getPromptsForUser` / `getPromptsForTeam` / `getPublicPrompts`

### 4.3 B 类双态资源的取数规则（Prompt 样板）

```ts
// personal 视图：看自己的（不区分 visibility，自己的都能看）
getPromptsForUser({ userId })
  → WHERE ownerId = userId

// team 视图：看团队内的
getPromptsForTeam({ teamId })
  → WHERE teamId = ?
    AND visibility IN ('TEAM', 'PUBLIC')

// discover 视图：看广场上的（任何人都能看，包括游客）
getPublicPrompts()
  → WHERE visibility = 'PUBLIC'
```

**注意**：`getPromptsForTeam` 不会返回 `visibility = 'PRIVATE'` 的记录。即使是团队成员也看不到别人 `PRIVATE` 的 Prompt（PRIVATE 永远只在 personal 视图出现）。

### 4.4 分享到团队（新增，核心动作）

**问题**：用户在个人空间写了一个 Prompt，觉得对团队有用，想"分享"到团队。这是一个跨态转换动作。

**三种实现方案**（待 §7.5 拍板，草案推荐 A）：

#### 方案 A：复制式（推荐，对齐设计 2.0.md:618 的 `ProjectAssetCopy`）

```
个人 Prompt           团队 Prompt（新记录）
ownerId = userId  →   ownerId = null
teamId  = null        teamId  = teamId
visibility = PRIVATE  visibility = TEAM
```

- **优点**：个人删了团队那份还在；权限边界清晰；与设计 2.0.md 一致
- **缺点**：两份内容会 diverge（团队副本可被团队成员编辑，个人原稿保持不变）

#### 方案 B：引用式

```
个人 Prompt           TeamAssetReference（仅引用记录）
ownerId = userId      sourceType = 'prompt'
teamId  = null        sourceId   = <个人 Prompt id>
visibility = PRIVATE  teamId     = teamId
```

- **优点**：内容只有一份，团队成员编辑 = 编辑个人原稿
- **缺点**：个人删了团队那边引用失效；权限模型复杂（团队成员能改"别人的"资源？）

#### 方案 C：移动式（不可逆）

```
个人 Prompt  →  团队 Prompt（原记录更新）
ownerId = userId → null
teamId  = null   → teamId
```

- **优点**：最简单，无冗余
- **缺点**：个人空间没了；不可逆；若被踢出团队资源也跟着没

#### API 设计（无论选哪个方案，外部接口一致）

```ts
POST /api/teams/:teamId/prompts
  body: { sourcePromptId, mode: 'copy' | 'reference' | 'move', projectId? }
  auth: withTeam({ requiredRole: 'EDITOR' })
```

---

## 5. Prisma Schema 草案

### 5.1 新建 `prisma/schema/team.prisma`

```prisma
// prisma/schema/team.prisma（新建）

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ A 类：团队级资源 ============

model Team {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String  // 用户可自定义："前端开发"、"XX 公司"、"XX 部门" 都行
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner   User        @relation("TeamOwner", fields: [ownerId], references: [id])
  ownerId String

  members  TeamMember[]
  projects TeamProject[]
  prompts  Prompt[]     // 团队态的 Prompt（visibility='TEAM'|'PUBLIC'）

  @@schema("team")
}

model TeamMember {
  id        String   @id @default(cuid())
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  role      TeamRole @default(VIEWER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([teamId, userId])  // 同一人同团队只能有一条
  @@index([userId])           // 用于"查我加入的所有团队"
  @@schema("team")
}

enum TeamRole {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}

model TeamProject {
  id        String   @id @default(cuid())
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId    String
  name      String  // "UI 部门"、"动画部门"、"前端区域" 等团队内子单元
  createdAt DateTime @default(now())

  prompts Prompt[]

  @@index([teamId])
  @@schema("team")
}

// ============ B 类样板：Prompt（双态）============

model Prompt {
  id         String           @id @default(cuid())
  title      String
  content    String
  visibility PromptVisibility @default(PRIVATE)

  // —— 双态归属（互斥）——
  owner      User?         @relation("PromptOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  ownerId    String?       // 个人态必填
  team       Team?         @relation(fields: [teamId], references: [id], onDelete: Cascade)
  teamId     String?       // 团队态必填
  project    TeamProject?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  projectId  String?       // 可选：归到团队下某个项目

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ownerId])
  @@index([teamId])
  @@index([visibility])  // discover 广场查询主索引
  @@check(
    (ownerId IS NOT NULL AND teamId IS NULL) OR  -- 个人态
    (ownerId IS NULL AND teamId IS NOT NULL)      -- 团队态
  )
  @@schema("team")
}

enum PromptVisibility {
  PRIVATE  // personal 视图：仅 owner 可见
  TEAM     // team 视图：团队成员可见
  PUBLIC   // discover 视图：任何人（含游客）可见
}
```

### 5.2 在现有 `prisma/schema/schema.prisma` 的 User 模型加反向关系

> 修改 `schema.prisma:17-34` 的 `User` 模型，新增 3 个反向关系字段：

```prisma
model User {
  // ... 现有字段保持不变

  // —— 新增反向关系（对应 team schema）——
  ownedTeams   Team[]         @relation("TeamOwner")
  teams        TeamMember[]
  ownedPrompts Prompt[]       @relation("PromptOwner")
}
```

### 5.3 关键设计点说明

| 设计点                             | 理由                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| 表名用 `Team` 而非 `Workspace`     | 产品语义就是"团队"；用户在 UI 上看到的是"团队"二字；字段名 `teamId` 比 `workspaceId` 更贴近产品 |
| `@@unique([teamId, userId])`       | 防止同一人在同一团队有多条成员记录                                                              |
| `@@check(...)` 约束                | 保证双态字段互斥（PostgreSQL 支持，SQLite 不支持）                                              |
| `onDelete: Cascade`                | 删团队时连带清理数据，避免孤儿记录                                                              |
| 用 `enum` 而不是 `string`          | 防止脏数据；代价是改值需要 migration                                                            |
| `TeamProject.prompts` 用 `SetNull` | 删项目时 Prompt 不消失，只是变成"未归类"                                                        |
| 多 schema（`@@schema("team")`）    | 沿用项目现有约定（已有 `auth`、`token` 两个 schema）                                            |

---

## 6. 从现状到目标的迁移路径

| 步骤 | 动作                                                                                                                 | 涉及文件                           |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1    | 新建 `prisma/schema/team.prisma`（Team + TeamMember + TeamProject + Prompt 四张表）                                  | 新增                               |
| 2    | 在 `schema.prisma` 的 User 模型加反向关系字段                                                                        | `schema.prisma:17-34`              |
| 3    | `prisma migrate dev --name add_team_schema`                                                                          | 命令                               |
| 4    | 新建 `src/shared/lib/auth/with-optional-session.ts`（第零道闸）                                                      | 新增                               |
| 5    | 新建 `src/shared/lib/auth/with-team.ts`（第一道闸），内部调 `withSession`                                            | 新增（参考 `with-session.ts:111`） |
| 6    | 新建 `src/shared/lib/api/rbac-v2/`，放 `roles.ts`（TeamRole enum）+ `can.ts`（权限判定函数）+ `forms.ts`（三态判定） | 新增；旧的 `rbac/` 保留不动        |

---

## 7. 待决开放问题

> 本节列出需要拍板但本轮先搁置的问题，等落地前再讨论。

### 7.1 团队标识用 `slug` 还是 `team_xxx`

- Dub 同时支持两者（slug 如 `dub-sh`，或 `ws_xxx` 前缀的 id）。
- 本草案 schema 里同时定义了 `id` (cuid) 和 `slug` (@unique)，API 层可以都接受。

### 7.2 visibility 三态用 `enum` 还是 `string`

- 草案用了 PostgreSQL `enum`（防脏数据，但改值要 rename migration）。
- 备选：用 `string` + Zod 校验（更灵活，但失去 DB 层保障）。

### 7.3 游客看到的"个人空间"具体语义（草案假设）

- **草案假设**：游客点 `/spec/personal` → 看到所有 `visibility=PUBLIC` 的个人资源聚合（按收藏数/创建时间排序），相当于"精选个人作品展示"
- **备选 A**：游客点 `/spec/personal` → 重定向到登录引导页（不展示任何内容）
- **备选 B**：建一个 demo 账号，游客看 demo 账号的个人空间

### 7.4 "分享到团队"的实现方式（草案推荐 A）

- 见 §4.4 详细对比
- **方案 A（复制式）**：草案推荐；与设计 2.0.md:618 `ProjectAssetCopy` 一致
- **方案 B（引用式）**：内容只有一份但权限复杂
- **方案 C（移动式）**：最简但不可逆

### 7.5 加入团队后，个人资源的默认归属（草案假设）

- **草案假设**：加入团队**不改变**个人资源的归属。个人资源永远挂在 `ownerId` 下，只有显式"分享到团队"才转成团队资源。
- **备选**：加入团队时引导用户选择"是否把某些个人资源一起带到团队"

### 7.6 `User.defaultTeamId`（来自 2.0 文档）

- 产品 2.0.md 提到注册后要有"默认工作空间"
- **草案建议**：注册时不强制创建团队（因为个人用户也能用），用户首次主动创建/加入团队时再设 `defaultTeamId`
- 当前代码已有占位：`src/shared/lib/zod/schemas/user.ts:18-19`、`app/api/user/route.ts:70-71`

---

## 8. 与 Dub 代码的对照速查

> 便于学习时对照查看 Dub 的真实实现。

| 概念                   | ai-spec 本设计                                        | Dub 真实代码                                           |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| 第零道闸（游客判定）   | `withOptionalSession`（新建）                         | ——（Dub 无游客概念）                                   |
| 第一道闸（成员判定）   | `withTeam`（新建）                                    | `apps/web/lib/auth/workspace.ts:387-452`               |
| 第一道闸内部：查成员表 | `TeamMember.findFirst({ where: { userId, teamId } })` | 同上，`include: { users: { where: { userId } } }`      |
| 第一道闸失败响应       | `not_found`                                           | `not_found`（不暴露存在性）                            |
| 第二道闸命名约定       | `getXxxForTeam`                                       | `apps/web/lib/api/links/get-links-for-workspace.ts:91` |
| 第二道闸过滤条件       | `WHERE teamId = ?`                                    | `where: { projectId }`                                 |
| 成员关系表             | `TeamMember`                                          | `ProjectUser`                                          |
| 团队/工作空间表        | `Team`                                                | `Project`（Dub 的 Project 即工作空间）                 |
| 角色 enum              | `TeamRole`（OWNER/ADMIN/EDITOR/VIEWER）               | `ProjectRole`                                          |
| 资源双态支持           | ✅ 个人（ownerId） + 团队（teamId）                   | ❌ 所有资源都在 workspace 内                           |
| 跨态转换               | §4.4"分享到团队"动作                                  | ——（不存在）                                           |
| 游客访问               | ✅ discover + 部分 personal                           | ❌ 全部需要登录                                        |

---

## 9. 与 v1（旧 RBAC）的差异说明

> 解释为什么 v1 必须替换而不是演进。

| 维度         | v1（旧）                                              | v2（本设计）                                                                     |
| ------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| 模型类型     | 全局角色 + 资源 action 二元组                         | 三态用户 + 团队级角色 + 三道闸门                                                 |
| 多租户       | 无租户概念                                            | Team 为核心边界                                                                  |
| 用户形态     | 仅"登录用户"                                          | **游客 / 个人 / 团队成员** 三态                                                  |
| 角色归属     | `User.role`（一身一个）                               | `TeamMember.role`（每团队一个）                                                  |
| 权限判定时机 | 每次操作都查矩阵                                      | 只在第一道闸查一次                                                               |
| 资源清单     | prompt/agent/tutorial/folder/testSession/user（6 个） | Team/TeamProject/Prompt/RuleSpec/AgentsDocument/Skill/Agent/Plugin/...（16+ 个） |
| 接线状态     | 零引用，从未生效                                      | ——                                                                               |
| 数据隔离方式 | 未明确                                                | `WHERE teamId = ?` 强制过滤                                                      |
| 双态支持     | 无                                                    | 个人（ownerId）+ 团队（teamId）                                                  |
| 跨态转换     | 无                                                    | §4.4"分享到团队"动作                                                             |

**v1 目录处置**：保留不动，不删除（git history 可找回，但保留可作为对照）。

---

## 附录：调研依据

本设计的全部依据来自以下文件：

- **旧 RBAC**：
  - `src/shared/lib/api/rbac/permissions.ts`
  - `src/shared/lib/api/rbac/resources.ts`
- **数据模型**：
  - `prisma/schema/schema.prisma`（User/Account/Session）
  - `prisma/schema/token.prisma`（Token/VerificationToken/EmailVerificationToken）
- **现有鉴权**：
  - `src/shared/lib/auth/with-session.ts:111-171`（唯一的鉴权闸门）
  - `app/api/user/route.ts:26,73`（当前硬编码 `session.user.id` 过滤）
  - `src/shared/lib/api/error.ts:17-18`（UNAUTHORIZED/FORBIDDEN 已预留）
- **产品规划**：
  - `docs/项目设计/项目设计2.0.md`（第 432-650 行：权限模型、资源清单、迁移规划）
- **导航占位**：
  - `src/widgets/dual-sidebar/model/navigation-data.ts`（personal/team/discover 三视图已就位）
