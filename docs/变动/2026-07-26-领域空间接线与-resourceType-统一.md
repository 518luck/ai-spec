# 2026-07-26（第三批）领域空间接线 + resourceType 命名统一

> 承接 [第一批：规约库双视图与编辑器改造](./2026-07-26-规约库双视图与编辑器改造.md)、[第二批：弹窗形变动效与规约领域空间](./2026-07-26-弹窗形变动效与规约领域空间.md)，本篇只记第二篇之后的改动。
> 基线仍是 `d7dceef`，本篇涉及 7 个文件（含 2 个 prisma schema），全是改、无新增。

## 一句话总览

一批收尾性质的小改，三条线：

1. **`resourceType` 从 `"ruleFolder"` 统一为 `"rules"`** —— 第二篇里标记的"文档与代码不一致"，结论是代码侧也错了，这是个真实 bug。
2. **`PUT /api/rules/[id]` 补上空间校正** —— 改规约时换文件夹，空间归属要跟着走。
3. **`getFolders` 支持按空间过滤** —— 领域空间接入前端的第一步（仍未接完）。

---

## 一、resourceType 统一为 `"rules"`（真实 bug 修复）

### 是什么问题

规约文件夹复用 `Folder` 表，靠 `resourceType` 区分归属。代码里有两套写法：

- `FOLDERABLE_RESOURCE_KEYS`（`src/server/rbac/resource-ui.ts`，单一真相）里只有 `"rules"`；
- 规约库页面和规约编辑表单给 `FolderCombobox` 传的却是 `"ruleFolder"`。

后果不只是"命名不统一"，而是**规约文件夹在接口层根本不通**：

| 路径                | 行为                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GET /api/folders`  | `type` 直接进 where（不走 schema 校验），按 `resource_type = 'ruleFolder'` 查 → 永远查不到行                          |
| `POST /api/folders` | 走 `createFolderDtoSchema` 校验，`resourceType` 是 `z.enum(FOLDERABLE_RESOURCE_KEYS)` → `"ruleFolder"` 直接被拒        |

也就是说：**规约页的文件夹下拉一直是空的，且在里面新建文件夹必然失败** —— 既然 POST 建不出这种行，GET 也就永远查不到，两头自洽地坏着。

### 文件清单

| 文件                                                | 改动内容                                                                                   | 为什么                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `src/pages/spec/personal/rules/ui/page.tsx`           | `<FolderCombobox resourceType="ruleFolder" />` → `"rules"`                                  | 规约库页顶部的文件夹筛选，改成 RBAC 清单里真实存在的 key                                                |
| `src/pages/spec/personal/rules/ui/rule-editor-form.tsx` | 同上，状态栏里的文件夹选择器改为 `"rules"`                                                  | 与列表页保持同一个取值，否则编辑页建的文件夹列表页看不见                                                |
| `prisma/schema/folder.prisma`                         | `ruleSpaceId` 注释里的 `resourceType="ruleFolder"` → `"rules"`                               | 注释与实际取值对齐（列语义不变，无需迁移）                                                              |
| `prisma/schema/rule.prisma`                           | 文件头三层结构说明 + `RuleSpace.folders` 关系注释里的 `"ruleFolder"` → `"rules"`（2 处）      | 同上                                                                                                  |

> 数据影响：无。种子脚本（`scripts/db/*`）里没有创建规约文件夹的逻辑，接口层也不可能产出 `resource_type='ruleFolder'` 的行，所以不存在需要迁移的历史数据。若某个开发库里有手工造的这类行，改动后会变成不可见 —— 直接删掉即可。

---

## 二、`PUT /api/rules/[id]`：换文件夹时校正空间归属

| 文件                          | 改动内容                                                                                                                                          | 为什么                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/api/rules/[id]/route.ts`   | ① 传了 `folderId` 时先查目标文件夹（限本人所有）并取 `ruleSpaceId`，查不到抛 `NOT_FOUND`；② `if (targetFolder?.ruleSpaceId) data.spaceId = ...`      | 与第二篇给 `POST /api/rules` 加的约束是同一件事的另一半：`Rule.spaceId` 是冗余列，**必须与所在文件夹的空间一致**。把规约移进另一个空间的文件夹时，若 `spaceId` 不跟着走，规约会滞留在原空间——在新空间里看不到它，在旧空间里却又不属于任何文件夹。顺带补上了之前缺失的"文件夹是否属于本人"校验 |

> 注意保留的语义：**清空文件夹（`folderId` 传 `null`/`""`）只是变成"未分类"，规约仍留在原空间**，不动 `spaceId`。这是有意的 —— 空间是规约的"家"，未分类只是没进子分类。

---

## 三、`getFolders` 支持按领域空间过滤

| 文件                                              | 改动内容                                                                                                              | 为什么                                                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/entities/folder/api/folder.ts`                 | ① `getFolders(type: string)` → `getFolders({ type, spaceId })`，定义 `GetFoldersOptions`，用 `URLSearchParams` 拼参数    | 参数从 1 个变成 2 个且含可选参数，按项目规范（AGENTS.md「Options Object」）必须改成参数对象；`spaceId` 对接第二篇给 `GET /api/folders` 加的空间过滤            |
|                                                   | ② `createFolder` 的请求体加上 `spaceId` 透传                                                                           | 新建规约文件夹时能指定落到哪个空间（省略仍走后端的个人默认空间回落）                                                                                          |
| `src/features/folder-combobox/ui/folder-combobox.tsx` | 调用点跟着改成 `getFolders({ type })`                                                                                  | 唯一调用方的签名适配；**暂未传 `spaceId`**，组件也还没开这个 prop                                                                                            |

---

## 四、验证

| 检查                 | 结果                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pnpm run typecheck` | 通过，无报错                                                                                                            |
| `pnpm run lint`      | 4 warnings，全部在 `scripts/db/prompt-records.ts` / `scripts/db/rules.ts`（种子数据里的 SQL 示例字符串），与本次改动无关 |

> prisma schema 只改了注释，无需 `prisma:migrate`。但 `src/shared/db/generator/` 里内嵌的 schema 字符串仍是旧注释，跑一次 `pnpm run prisma:generate` 可同步（纯注释，不影响运行时行为）。

---

## 五、遗留 / 待确认

**第二篇标记的两项，一项已解决、一项仍在**：

- ✅ `resourceType` 命名不一致 —— 本篇修掉，且确认是代码侧的 bug 而非注释过期。
- ⏳ 领域空间前端仍未接完，比第二篇前进了半步：

| 环节                                | 状态                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| 后端接口（列表/新建空间、按空间过滤规约与文件夹） | ✅ 已通                                                                 |
| `getRuleSpaces` / `createRuleSpace` | ⚠️ 已导出，**无调用方**                                                  |
| `getFolders`                        | ✅ 支持 `spaceId` 参数，⚠️ 但 `FolderCombobox` 没开 prop、没传值           |
| `getRules`                          | ❌ **仍未透传 `spaceId`**（`src/entities/rule/api/get-rules.ts` 只拼 `folderId`/`tagIds`/`q`/`offset`） |
| 空间切换 UI                          | ❌ 不存在                                                               |

要真正跑起来，剩下的最小闭环是：`getRules` 补 `spaceId` → `FolderCombobox` 加 `spaceId` prop → 页面加空间切换器（并决定 spaceId 存 URL 还是别处，建议与 `?view=` 一致走 URL）。

**其他（沿用第二篇）**：

- 空间只有列表 + 新建，缺改名 / 删除 / 排序接口；`sortOrder` 已写入但无拖拽 UI。
- `app/api/rules/spaces/route.ts` 只覆盖个人空间（`teamId: null`），团队空间等 `defaultWorkspace` 基础设施上线后再接。
