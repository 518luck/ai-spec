# ai-spec RBAC 设计 v3.0

> **状态**：草案 v3.0
> **唯一依据**：`app/spec/(dashboard)/**` 路由 + `src/widgets/dual-sidebar/model/navigation-data.ts`
> **设计取向**：以实际路由为唯一真相源，放弃 v1 的臆造资源清单和 v2 的工作空间隔离模型

### 修订记录

| 版本         | 变更                                                                                                                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v3.0（本版） | 以现有路由为唯一依据重新推导：砍掉路由中不存在的资源（tutorial/folder/testSession/user）；重新定义 4 个全局角色（guest/member/admin/owner）；只产出纯常量三件套（角色/权限/映射表），不写判定函数、不引 Prisma、不接 session、不做工作空间维度 |

---

## §0. 本版范围（先读这一节）

本版只做**全局角色 + 纯常量三件套**，边界明确：

| 维度                                 | 本版做不做 | 说明                                   |
| ------------------------------------ | ---------- | -------------------------------------- |
| 角色定义（枚举）                     | ✅ 做      | 4 个全局角色                           |
| 权限位（资源.动作）                  | ✅ 做      | 约 20 个，严格按路由反推               |
| 角色 → 权限映射表                    | ✅ 做      | 常量，不含判定逻辑                     |
| 判定函数（`hasPermission`）          | ❌ 不做    | 下个版本（v3.1）                       |
| 改 `navigation-data.ts`（菜单过滤）  | ❌ 不做    | 下个版本                               |
| session 注入（JWT 放角色）           | ❌ 不做    | 下个版本                               |
| Prisma model                         | ❌ 不做    | 本版纯前端常量                         |
| 工作空间维度                         | ❌ 不做    | 按当前选择"全局角色，暂时不管工作空间" |
| 资源状态机（publish/review 等 ABAC） | ❌ 不做    | 留给更后续版本                         |

---

## §1. 现状诊断：为什么必须重写

当前 `src/shared/lib/api/rbac/` 下有两个文件，**都是死代码、零引用**，且和实际路由完全对不上。

### 1.1 `permissions.ts`（旧）

- 定义角色 `guest / user / creator / owner`
- 定义资源动作矩阵

**问题**：这套角色和动作矩阵，在 `navigation-data.ts` 和任何路由文件里都找不到对应。它是凭空写的，从未生效。

### 1.2 `resources.ts`（旧）

列出 6 个资源：

```text
prompt / agent / tutorial / folder / testSession / user
```

**问题**：逐项核对路由后发现：

| 旧资源        | 路由里有没有                                                                  | 结论          |
| ------------- | ----------------------------------------------------------------------------- | ------------- |
| `prompt`      | ✅ personal 和 discover 都有 Prompt 菜单                                      | 保留          |
| `agent`       | ⚠️ 有"Agents"菜单，但语义是 AI 规约下的一项，不是独立资源                      | 归并到 aiSpec |
| `tutorial`    | ❌ 路由里没有                                                                 | 删除          |
| `folder`      | ❌ 路由里没有                                                                 | 删除          |
| `testSession` | ❌ 路由里没有                                                                 | 删除          |
| `user`        | ❌ 路由里没有"用户管理"菜单（settings 里的 profile 是个人资料，不是用户管理） | 删除          |

**结论**：旧文件全部作废，以路由为唯一依据重写。

---

## §2. 从路由反推的真实模型（核心事实）

本版所有的角色、权限、资源，都从下面这张表反推出来。这张表是整个设计的**唯一事实基础**，每一项都能在 `navigation-data.ts` 或路由文件里找到出处。

| 业务区域              | 路由前缀         | 实际菜单项（从 navigation-data.ts 逐项反推）                                                                                             |
| --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **personal** 个人空间 | `/spec/personal` | prompt（收录 / 草稿）、rules（规约库）、aiSpec（AGENTS.md / Skills / Agents / Plugins）                                                  |
| **team** 工作空间     | `/spec/team`     | project（项目）、teamSet（团队）、member（成员）、shared-assets（AGENTS.md / Skills / Agents / Plugins）、security（安全）、logs（日志） |
| **discover** 发现     | `/spec/discover` | prompt、aiSpec（AGENTS.md / Skills / Agents / Plugins）—— **全部只读浏览**                                                               |
| **settings** 设置     | `/spec/settings` | profile（个人详情）、preferences（偏好）、apiKey（Key 管理）                                                                             |

### 2.1 关键观察

1. **discover 区全部是只读**。它没有 write/delete 入口，只有 read。这意味着 discover 的权限模型最简单：所有人都能 read，无人能 write（写入走个人空间 + publish）。
2. **personal 和 team 都有 aiSpec 四件套**（AGENTS.md / Skills / Agents / Plugins），只是归属不同（个人 vs 团队共享）。本版用统一的 `aiSpec` 资源表达，不拆成 4 个。
3. **navigation-data.ts 已经预留扩展点**：
   - `NavAreaItem.locked` 字段（草稿项已用：`locked: true`）
   - 注释 `// TODO : 后面可以根据工作空间来分布设置` 和 `// TODO : 后面需要根据工作空间来设置`

   说明作者早就为"按角色/工作空间过滤菜单"留了位置。本版定义的权限位，未来正是塞进这些扩展点的。

---

## §3. 资源清单（严格按路由，7 个）

砍掉路由里不存在的，只保留实际菜单对应的资源。

| 资源 key    | 中文名                                                | 路由出处                            | 支持动作                        |
| ----------- | ----------------------------------------------------- | ----------------------------------- | ------------------------------- |
| `prompt`    | 提示词                                                | personal、discover 的 Prompt        | read / write / delete / publish |
| `rules`     | 规约库                                                | personal 的"规约库"                 | read / write                    |
| `aiSpec`    | AI 规约（AGENTS.md / Skills / Agents / Plugins 聚合） | personal、team、discover 都有这四项 | read / write / delete           |
| `project`   | 项目                                                  | team 的"项目"                       | read / write / manage           |
| `member`    | 成员                                                  | team 的"成员"                       | read / manage                   |
| `workspace` | 工作空间管理（teamSet / security / logs）             | team 的"管理"分组                   | read / manage                   |
| `apiKey`    | Key 管理                                              | settings 的"Key 管理"               | read / manage                   |
| `profile`   | 个人资料与偏好                                        | settings 的 profile + preferences   | read / write                    |

> **注**：`tutorial / folder / testSession / user` 这四个旧资源，路由里没有对应菜单，**本版不保留**。如果未来路由新增了对应菜单，再回来补资源。

---

## §4. 动作清单（粗粒度，5 个）

所有资源共用同一套动作词，按"粗粒度"设计（你上一轮的选择）。

| 动作      | 语义                | 典型场景                                               |
| --------- | ------------------- | ------------------------------------------------------ |
| `read`    | 查看 / 浏览         | 列表、详情、发现区浏览                                 |
| `write`   | 新建 / 编辑         | 创建、更新内容                                         |
| `delete`  | 删除                | 删除资源                                               |
| `manage`  | 管理类操作          | `member.invite/remove`、`workspace.settings`、角色配置 |
| `publish` | 发布到发现区 / 公开 | 把个人 prompt 推到 discover                            |

> `manage` 是"管理"动作的占位词，覆盖一切非内容读写的管理操作（邀请成员、改团队设置、查看日志）。未来如果某个资源的管理动作分化严重，再拆成更细的（如 `member.invite` / `member.remove`）。

---

## §5. 权限位（资源.动作组合）

权限命名沿用 v1 的 `资源.动作` 约定。以下是本版要导出的**全部权限位**（约 20 个），每个都标明语义和路由出处。

| 权限位             | 语义                     | 路由出处                        |
| ------------------ | ------------------------ | ------------------------------- |
| `prompt.read`      | 查看提示词               | personal、discover              |
| `prompt.write`     | 新建/编辑提示词          | personal                        |
| `prompt.delete`    | 删除提示词               | personal                        |
| `prompt.publish`   | 发布提示词到 discover    | personal → discover             |
| `rules.read`       | 查看规约库               | personal                        |
| `rules.write`      | 新建/编辑规约            | personal                        |
| `aiSpec.read`      | 查看 AI 规约四件套       | personal、team、discover        |
| `aiSpec.write`     | 新建/编辑 AI 规约        | personal、team                  |
| `aiSpec.delete`    | 删除 AI 规约             | personal、team                  |
| `project.read`     | 查看项目                 | team                            |
| `project.write`    | 新建/编辑项目            | team                            |
| `project.manage`   | 管理项目（归档、转移等） | team                            |
| `member.read`      | 查看成员列表             | team                            |
| `member.manage`    | 邀请/移除成员、改角色    | team                            |
| `workspace.read`   | 查看团队设置/安全/日志   | team（teamSet、security、logs） |
| `workspace.manage` | 修改团队设置、安全策略   | team（teamSet、security）       |
| `apiKey.read`      | 查看自己的 API Key       | settings                        |
| `apiKey.manage`    | 创建/删除/重置 API Key   | settings                        |
| `profile.read`     | 查看个人资料与偏好       | settings                        |
| `profile.write`    | 修改个人资料与偏好       | settings                        |

---

## §6. 全局角色（4 个）

本版采用全局角色（暂不引入工作空间维度）。4 个角色：

| 角色     | 含义               | 典型能力                                                              |
| -------- | ------------------ | --------------------------------------------------------------------- |
| `guest`  | 未登录访客         | 只能 `read` 发现区公开内容                                            |
| `member` | 普通登录用户       | 个人空间全部权限 + 发现区 read + 自己的 profile/apiKey                |
| `admin`  | 管理员             | member 全部 + team 空间管理权限（member/workspace/project 的 manage） |
| `owner`  | 超级管理员（预留） | 全部权限（当前路由无对应场景，预留枚举位，为未来工作空间落地做准备）  |

### 6.1 设计说明

- **`guest` 是运行时身份**，不入库，未登录请求一律按 guest 判定。
- **`member` 是默认登录角色**，覆盖绝大多数用户。
- **`admin` 承担团队管理职责**，在当前没有工作空间表的情况下，admin 是"能进 team 管理菜单"的角色。
- **`owner` 预留**：当前路由里没有"只有创建者能做"的独占动作，但工作空间落地后，owner 会承担"转让/解散团队"这类独占动作。本版先把枚举位立起来，映射表里先等同 admin（除未来预留项外）。

---

## §7. 角色 → 权限映射表

以下是本版要导出的**完整矩阵**。`✅` 表示该角色拥有此权限，`❌` 表示没有。

| 权限位             | guest | member | admin | owner |
| ------------------ | :---: | :----: | :---: | :---: |
| `prompt.read`      |  ✅   |   ✅   |  ✅   |  ✅   |
| `prompt.write`     |  ❌   |   ✅   |  ✅   |  ✅   |
| `prompt.delete`    |  ❌   |   ✅   |  ✅   |  ✅   |
| `prompt.publish`   |  ❌   |   ✅   |  ✅   |  ✅   |
| `rules.read`       |  ❌   |   ✅   |  ✅   |  ✅   |
| `rules.write`      |  ❌   |   ✅   |  ✅   |  ✅   |
| `aiSpec.read`      |  ✅   |   ✅   |  ✅   |  ✅   |
| `aiSpec.write`     |  ❌   |   ✅   |  ✅   |  ✅   |
| `aiSpec.delete`    |  ❌   |   ✅   |  ✅   |  ✅   |
| `project.read`     |  ❌   |   ❌   |  ✅   |  ✅   |
| `project.write`    |  ❌   |   ❌   |  ✅   |  ✅   |
| `project.manage`   |  ❌   |   ❌   |  ✅   |  ✅   |
| `member.read`      |  ❌   |   ❌   |  ✅   |  ✅   |
| `member.manage`    |  ❌   |   ❌   |  ✅   |  ✅   |
| `workspace.read`   |  ❌   |   ❌   |  ✅   |  ✅   |
| `workspace.manage` |  ❌   |   ❌   |  ✅   |  ✅   |
| `apiKey.read`      |  ❌   |   ✅   |  ✅   |  ✅   |
| `apiKey.manage`    |  ❌   |   ✅   |  ✅   |  ✅   |
| `profile.read`     |  ✅   |   ✅   |  ✅   |  ✅   |
| `profile.write`    |  ❌   |   ✅   |  ✅   |  ✅   |

### 7.1 矩阵解读

- **guest（2 项）**：`prompt.read` + `aiSpec.read` + `profile.read`。对应"未登录也能逛 discover"。
- **member（13 项）**：个人空间全部 + 发现区 read + profile/apiKey 全部。**不含任何 team 管理权限**（team 区对 member 只读都不开放——因为当前没有"团队成员"这一层，team 区整体先归给 admin）。
- **admin / owner（20 项）**：全部权限。本版两者等价，owner 仅为未来工作空间预留。

> **关于 team 区的说明**：当前路由里 team 区是单一前缀 `/spec/team`，没有"我是哪个团队的成员"这个维度。所以在工作空间落地前，team 区要么对 member 关闭、要么整体交给 admin。本版选**整体交给 admin**，避免 member 看到一堆无意义的占位菜单。

---

## §8. 重写后的 rbac 目录结构（设计草案，非实现）

> 以下为 v3.0 的目标目录形态。**本版只产出文档，不动代码**。代码落地在后续版本。

```text
src/shared/lib/api/rbac/
├── index.ts          # barrel 出口，统一导出
├── permissions.ts    # 资源 + 动作 + 权限位常量
└── roles.ts          # 全局角色枚举 + 角色→权限映射表
```

**变更**：删除旧的 `resources.ts`（内容并入 `permissions.ts`，资源和权限强相关，没必要拆两个文件）。

### 8.1 `permissions.ts` 设计草案

```ts
// 权限位 + 资源 + 动作的常量定义，严格对齐现有路由

// 资源 key（严格按路由反推，7 个）
export const RESOURCE_KEYS = [
  "prompt",
  "rules",
  "aiSpec",
  "project",
  "member",
  "workspace",
  "apiKey",
  "profile",
] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

// 动作（粗粒度，5 个）
export const ACTIONS = ["read", "write", "delete", "manage", "publish"] as const;
export type Action = (typeof ACTIONS)[number];

// 权限位（资源.动作组合，约 20 个）
export const PERMISSIONS = [
  "prompt.read", "prompt.write", "prompt.delete", "prompt.publish",
  "rules.read", "rules.write",
  "aiSpec.read", "aiSpec.write", "aiSpec.delete",
  "project.read", "project.write", "project.manage",
  "member.read", "member.manage",
  "workspace.read", "workspace.manage",
  "apiKey.read", "apiKey.manage",
  "profile.read", "profile.write",
] as const;
export type Permission = (typeof PERMISSIONS)[number];
```

### 8.2 `roles.ts` 设计草案

```ts
// 全局角色枚举 + 角色→权限映射表

// 4 个全局角色
export const ROLES = ["guest", "member", "admin", "owner"] as const;
export type Role = (typeof ROLES)[number];

// member 的基础权限（个人空间 + 发现区 read + profile/apiKey）
const MEMBER_PERMISSIONS: Permission[] = [
  "prompt.read", "prompt.write", "prompt.delete", "prompt.publish",
  "rules.read", "rules.write",
  "aiSpec.read", "aiSpec.write", "aiSpec.delete",
  "apiKey.read", "apiKey.manage",
  "profile.read", "profile.write",
];

// guest 的权限（发现区只读 + profile 只读）
const GUEST_PERMISSIONS: Permission[] = [
  "prompt.read", "aiSpec.read", "profile.read",
];

// admin 在 member 基础上追加 team 管理权限
const ADMIN_PERMISSIONS: Permission[] = [
  ...MEMBER_PERMISSIONS,
  "project.read", "project.write", "project.manage",
  "member.read", "member.manage",
  "workspace.read", "workspace.manage",
];

// 角色 → 权限映射表
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  guest: GUEST_PERMISSIONS,
  member: MEMBER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  owner: ADMIN_PERMISSIONS, // 本版等同 admin，为未来工作空间预留
};
```

### 8.3 `index.ts` 设计草案

```ts
// rbac 目录统一出口
export * from "./permissions";
export * from "./roles";
```

---

## §9. 明确不在本版范围

为避免范围蔓延，以下事项**本版一律不做**，留给后续版本：

| 事项                                           | 留给 | 原因                                             |
| ---------------------------------------------- | ---- | ------------------------------------------------ |
| 判定函数 `hasPermission(role, permission)`     | v3.1 | 本版只立常量，不写逻辑                           |
| 改 `navigation-data.ts`（菜单按权限过滤）      | v3.2 | 需要先有判定函数                                 |
| session 注入（JWT/session 带 role）            | v3.2 | 菜单过滤需要前端拿到 role                        |
| API/Action 层 guard（`requirePermission`）     | v3.3 | 需要先有 session 注入                            |
| Prisma model（角色持久化）                     | v3.x | 本版是前端常量，角色暂不入库                     |
| 工作空间维度（每空间不同角色）                 | v4.x | 当前路由无工作空间概念，等 team 区落地实体后再做 |
| 资源状态机（draft/published/archived 的 ABAC） | v5.x | 与 RBAC 正交，独立演进                           |

---

## §10. 版本路线

```text
v3.0（本版）  全局角色 + 常量三件套，严格对齐现有路由
     │
     ▼
v3.1  判定函数 hasPermission(role, permission)
     │
     ▼
v3.2  navigation-data 菜单过滤 + session 注入 role
     │
     ▼
v3.3  API / Action 层 guard（requirePermission）
     │
     ▼
v4.x  工作空间维度（team 区落地实体后，引入 WorkspaceRole）
     │
     ▼
v5.x  资源状态机 ABAC（draft/published/archived）
```

---

## 附录：本版与旧版的差异

| 维度         | v1（旧 permissions.ts）                                                        | v3.0（本版）                                                                        |
| ------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 角色         | `guest / user / creator / owner`                                               | `guest / member / admin / owner`                                                    |
| 资源清单     | `prompt/agent/tutorial/folder/testSession/user`（6 个，含 4 个路由里不存在的） | `prompt/rules/aiSpec/project/member/workspace/apiKey/profile`（7 个，全部对齐路由） |
| 是否对齐路由 | ❌ 完全不对齐                                                                  | ✅ 逐项可追溯                                                                       |
| 接线状态     | 零引用                                                                         | 本版只产出文档，落地见 v3.1+                                                        |
| 判定函数     | 无                                                                             | 无（本版不做，v3.1 做）                                                             |
| 工作空间维度 | 无                                                                             | 无（本版不做，v4.x 做）                                                             |
