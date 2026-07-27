# 未提交改动 Review 计划书

> 生成日期：2026-07-27。当前 main 分支有 ~200 个未提交文件（AI 生成；初版 192 个，后因 discover 域迁移与 review 文档新增略有增长），本文档将其拆成 8 个独立功能块，按 review 优先级排序，作为拆 commit 与逐组 review 的执行清单。

## 总览

| #   | 功能块                             | 规模     | 风险                       | 状态        |
| --- | ---------------------------------- | -------- | -------------------------- | ----------- |
| 1   | Discover 广场同步管线（原 Skills） | ~35 文件 | 🔴 高：动数据库 + 后台任务 | ☐ 未 review |
| 2   | 规约领域空间 (Rule Spaces)         | ~15 文件 | 🔴 高：动数据库 + API 行为 | ☐ 未 review |
| 3   | 规约库双视图与编辑器改造           | ~15 文件 | 🟡 中                      | ☐ 未 review |
| 4   | 快捷键系统                         | ~10 文件 | 🟡 中：全局行为            | ☐ 未 review |
| 5   | Fumadocs 文档站                    | ~20 文件 | 🟡 中：改了构建配置        | ☐ 未 review |
| 6   | 弹窗与卡片 UI 统一                 | ~15 文件 | 🟢 低                      | ☐ 未 review |
| 7   | agents-md 页面（含 mock 数据）     | ~10 文件 | 🟢 低，半成品              | ☐ 未 review |
| 8   | Demo 演示页                        | ~40 文件 | 🟢 低：纯演示              | ☐ 未 review |

## 建议流程

1. **按分组拆成 8 个 commit**（顺序：1 → 2 → 3 → … → 8，底层先行，prisma 依赖在前）。每个 commit 的 diff 是一个完整独立的故事。
2. **人工重点只看高风险的 20%**（见各组「review 重点」）。
3. 拆完 commit 后跑 **`/code-review ultra`** 做多智能体云端 review，兜底扫剩下的 80%。

### 跨组共享文件（拆 commit 时注意）

- `package.json` / `pnpm-lock.yaml`：被组 5（fumadocs 系列、gray-matter、@orama/tokenizers）、组 7（@headless-tree）、组 8 等共同触碰。建议随**组 5** 一起提交，或单独提一个 `chore: deps` commit 放在最前。
- `prisma/schema/schema.prisma`：已确认改动全部归组 1（schemas 数组的 agents/discover + User 反向关系），组 2 未涉及。
- `content/docs/hotkeys.mdx`：内容属于组 4（快捷键），载体属于组 5（文档站），建议随组 5 提交。

---

## 组 1：Discover 广场同步管线（原 Skills 域）🔴

三层同步管线（scan → sync-repo → sweep），含数据库模型、队列任务、导入 API 与发现页。

> 2026-07-27 已整体迁入 discover 域：schema/表/队列/API/权限全链路改名，删除用户自建预留字段（origin/ownerId），详见迁移 migration `20260726170335_discover_rename`。以下清单为迁移后的最终路径。

### 文件清单

**数据库**

- `prisma/schema/discover.prisma`（新，原 skill.prisma，已迁移到 discover 域）
- `prisma/schema/agents.prisma`（新；⚠️ 功能上属组 7 的地基，因与 skills 建表挤在同一个 migration `20260726140234` 里无法拆分，物理上只能随组 1 提交，commit message 需注明）
- `prisma/schema/schema.prisma`（改，归属组 1：schemas 数组 + User 反向关系，agents/discover 相关）
- `prisma/migrations/20260726140234_add_skill/`
- `prisma/migrations/20260726150441_add_skill_source/`
- `prisma/migrations/20260726153651_skill_source_ref_prefix/`
- `prisma/migrations/20260726170335_discover_rename/`（schema/表迁移到 discover 域 + 删用户预留字段）

**队列与 worker**

- `src/server/infrastructure/queue/operations/discover/`（enqueues×3、processors×3、index、types）
- `src/server/infrastructure/queue/constants.ts`、`index.ts`、`operations/router.ts`、`types.ts`（改）
- `worker.ts`（改）、`worker-globals.ts`（新）

**服务端工具与 API**

- `src/server/utils/discover-import.ts`、`discover-sync.ts`、`discover-vo.ts`
- `app/api/discover/skills/route.ts`、`app/api/discover/skills/import/route.ts`
- `src/shared/lib/zod/schemas/discover-skill.ts`

**前端**

- `src/entities/discover-skill/`（api/get-discover-skills、api/import-discover-skills、index）
- `app/spec/(dashboard)/discover/ai-spec/skills/page.tsx`
- `src/pages/spec/discover/ai-spec/skills/`（page、skill-card、import-dialog、index）

**权限（discover 域迁移新增改动）**

- `src/server/rbac/actions.ts`、`scopes.ts`、`resource-ui.ts`、`scopes.test.ts`（改，`skills.*` → `discover.*`，资源展示名「发现广场」）
- `src/shared/lib/zod/schemas/token.ts`（改，注释示例同步）

**配置**

- `.env.example`（改，GITHUB_TOKEN 相关）

### Review 重点

- [ ] 4 个 migration SQL：前 3 个建表，第 4 个手写 RENAME 迁移（重点看：是否全为 RENAME 无重建、Token scopes 的 UPDATE 语句）
- [ ] `app/api/discover/skills/*`：鉴权（`withSession`）、输入过 zod
- [ ] processors：失败重试、幂等性（重复入队会不会重复写库）
- [ ] GITHUB_TOKEN 的读取与缺省行为（不配置时是否优雅降级）
- [x] ~~同步/清理任务的写库语句带 `origin=github` 过滤~~ 已随迁移失效：origin 字段已删除，表就是纯广场缓存，无需过滤
- [ ] 🔴 **license 白名单漏洞（2026-07-27 实测确认）**：`discover-import.ts` 的 `normalizeLicense` 只归一 `NOASSERTION`，frontmatter 任意字符串都被当有效协议 → 库里 223 条非标准 SPDX 的条目存了全文，其中 **15 条明确标注 Proprietary**。修法：SPDX 白名单校验（可宽松归一 "MIT license" 这类写法），不认识 → 回落 `repoLicense` → 仍不认识按无协议处理（content=null）；另需存量清洗这 223 条的 content

---

## 组 2：规约领域空间 (Rule Spaces) 🔴

领域空间接线与 resourceType 统一（对应 docs/变动 两篇文档）。

### 文件清单

- `app/api/rules/spaces/route.ts`（新）
- `app/api/rules/route.ts`、`app/api/rules/[id]/route.ts`、`app/api/folders/route.ts`（改）
- `prisma/schema/folder.prisma`、`rule.prisma`、`team.prisma`（改）
- `src/server/utils/rule-space.ts`（新）
- `src/shared/lib/zod/schemas/rule-space.ts`（新）、`folder.ts`、`rule.ts`（改）
- `src/entities/rule/api/create-rule-space.ts`、`get-rule-spaces.ts`（新）、`get-rules.ts`、`index.ts`（改）
- `src/entities/folder/api/folder.ts`（改）
- `src/features/rule-space-combobox/`（combobox、create-space-dialog、space-icons、index）
- `src/features/folder-combobox/ui/folder-combobox.tsx`（改）

### Review 重点

- [ ] prisma 三个 schema 的关系改动是否有对应 migration（若无，需要跑 `pnpm run prisma:migrate`）
- [ ] `api/rules`、`api/folders` 的行为变更是否向后兼容（老数据没有 space 时的表现）
- [ ] 鉴权与越权：space 是否校验归属（个人/团队隔离）

---

## 组 3：规约库双视图与编辑器改造 🟡

### 文件清单

- `src/pages/spec/personal/rules/ui/card.tsx`、`grid.tsx`、`list.tsx`、`view-toggle.tsx`、`delete-rule-dialog.tsx`（新）
- `src/pages/spec/personal/rules/lib/list-motion.ts`（新）
- `src/pages/spec/personal/rules/ui/page.tsx`、`table.tsx`、`table-actions.tsx`、`create-page.tsx`、`rule-editor-form.tsx`（改）
- `app/spec/(dashboard)/personal/rules/page.tsx`、`create/page.tsx`（改）
- `src/features/markdown-editor/config/editor.ts`、`ui/markdown-editor.tsx`、`ui/quick-toolbar.tsx`（改）

### Review 重点

- [ ] `rule-editor-form.tsx`（+161 行）：表单校验、提交错误处理
- [ ] 双视图切换的状态持久化（刷新后视图是否保持）
- [ ] 删除对话框的二次确认与错误反馈

---

## 组 4：快捷键系统 🟡

全局快捷键 + kbar 命令面板改造（对应 docs/待处理/快捷键系统落地计划）。

### 文件清单

- `src/shared/configs/hotkeys.config.ts`、`src/shared/hooks/use-hotkey.ts`、`src/shared/lib/format-hotkey.ts`（新）
- `src/shared/hooks/index.ts`（改）
- `src/app/config/kbar-actions.tsx`（改）
- `src/app/providers/KBar.tsx → kbar.tsx`（重命名+改）
- `src/app/layouts/dashboard-layout.tsx`（改）
- `src/widgets/dual-sidebar/ui/command-entry.tsx`（新）、`dual-sidebar.tsx`、`icon-button.tsx`（改）
- `src/shared/ui/command.tsx`（改）
- `src/features/search-input/ui/search-input-field.tsx`（改）

### Review 重点

- [ ] 快捷键与浏览器/输入框的冲突处理（在 input/textarea 聚焦时是否屏蔽）
- [ ] Mac/Windows 修饰键兼容（⌘ vs Ctrl）
- [ ] KBar 重命名后 import 路径全部更新（typecheck 可兜底）

---

## 组 5：Fumadocs 文档站 🟡

（对应 docs/待处理/Fumadocs-文档站集成计划）

### 文件清单

- `app/docs/layout.tsx`、`app/docs/[[...slug]]/page.tsx`（新）
- `app/api/search/route.ts`（新）
- `content/docs/`（index、quickstart、hotkeys、guides/rules、guides/drafts、guides/records、meta.json×2）
- `source.config.ts`（新）
- `src/pages/docs/`（source、layout、page、mdx-components、search、layout-options、docs.css、index）
- `next.config.ts`、`tsconfig.json`、`.gitignore`、`dprint.jsonc`（改）
- `package.json`、`pnpm-lock.yaml`（改，建议随本组提交）

### Review 重点

- [ ] `next.config.ts` 改动只影响 docs，不影响主应用构建
- [ ] `postinstall: fumadocs-mdx` 在 CI/部署环境是否可用
- [ ] `app/api/search` 是否需要鉴权（文档搜索通常公开，确认预期）
- [ ] 已知：`pnpm build` 有 Turbopack+zod4 上游 bug，验证用 typecheck/lint/dev

---

## 组 6：弹窗与卡片 UI 统一 🟢

弹窗形变动效与卡片壳统一（对应 docs/变动/弹窗形变动效文档）。

### 文件清单

- `src/shared/ui/dialog.tsx`、`confirm-dialog.tsx`、`dropdown-menu.tsx`、`icons.tsx`（改）
- `src/shared/ui/content-card.tsx`（新）
- `src/pages/spec/personal/prompt/`：drafts（page、draft-card、edit-draft-dialog）、records（page、record-card、records-grid、edit-record-dialog）（改）
- 删除：`prompt/shared/ui/prompt-card-shell.tsx`、`prompt-card.tsx`
- 移动：`prompt/shared/ui/infinite-list-footer.tsx → src/shared/ui/`
- `app/spec/(dashboard)/personal/prompt/drafts/page.tsx`、`records/page.tsx`（改）
- `src/widgets/prompt-workspace/ui/prompt-workspace-dialog.tsx`、`src/widgets/page-shell/ui/title-page-shell.tsx`（改）
- `src/pages/spec/versions/ui/version-list-panel.tsx`（改，2 行）
- 删除：`src/shared/ui/sidebar.tsx`（-779 行，清理未用 shadcn 组件）

### Review 重点

- [ ] `sidebar.tsx` 删除前确认无引用（grep 兜底）
- [ ] 被删的 prompt-card-shell 的调用方是否全部迁到 content-card

---

## 组 7：agents-md 页面（含 mock 数据）🟢 半成品

### 文件清单

- `app/spec/(dashboard)/personal/ai-spec/agents-md/page.tsx`（新）
- `src/pages/spec/personal/ai-spec/agents-md/`（page、file-tree、doc-cards、project-cards、breadcrumb-nav、folder-icons、**model/mock-tree.ts**、index）
- `src/shared/ui/breadcrumb.tsx`（新）
- 依赖：`@headless-tree/core`、`@headless-tree/react`、`material-icon-theme`

### Review 重点

- [ ] ⚠️ `mock-tree.ts` 是写死的假数据——确认是否要随本次一起提交（页面尚未接真数据）
- [ ] 若提交，commit message 标注 WIP/mock
- [ ] 本组的数据库地基（`agents.prisma` 两张表 AgentsProject/AgentsDoc）已随组 1 的 migration 入库，但页面尚未接线（无 API 读写这两张表）——review 本组时知晓即可

---

## 组 8：Demo 演示页 🟢

纯演示代码，扫一眼即可。

### 文件清单

- `app/demo/motion/`、`empty-states/`、`login-hero/` 三个路由页
- `src/pages/demo/motion/`（10 文件）、`empty-states/`（9 文件）、`login-hero/`（12 文件）
- `src/shared/lib/motion.ts`（新，动效工具）
- `src/widgets/auth-side-panel/ui/spec-flow-scene.tsx`（新）、`side-panel.tsx`（改，登录页接入新场景）

### Review 重点

- [ ] 唯一影响生产的是 `side-panel.tsx`（登录页），看这一个就行
- [ ] 决策：demo 路由是否要在生产环境屏蔽（或仅 dev 可见）

---

## 待决策事项（不算功能代码）

1. **`docx/` 目录**：里面是 4 份个人简历文件（前端简历-AI应用方向 等）。大概率不该进仓库——建议加入 `.gitignore` 或移出项目目录。**提交前必须处理。**
2. **`docs/变动/`（3 篇）、`docs/待处理/`（3 篇）**：AI 写的计划/审查文档，建议单独一个 `docs:` commit，或确认哪些已过时可删。
3. **`pnpm-lock.yaml`**（+2393 行）：自动生成，跟随 package.json 提交即可，无需人工 review。
4. ~~Skill 拆表决策~~ **已解决（2026-07-27 discover 域迁移）**：原 `skill` schema 已整体迁移为 `discover` schema（表 `DiscoverSkill` / `DiscoverSource`），删除了 `origin` / `ownerId` 等用户预留字段，成为纯广场缓存；权限改为 `discover.read/write`，队列任务改为 `discover-scan / discover-sync-repo / discover-sweep`。用户自建 skill 将来在个人空间域独立建表，"Skill" 命名已空出。
5. **广场内容合规基线**：无协议条目已正确地只存元数据+回链；MIT/Apache 条目详情页需保证署名+协议标识+原仓库跳转；GPL/AGPL 条目若未来做"导入修改"功能，衍生内容需沿用原协议。license 白名单漏洞见组 1 review 重点。

## 每组验证命令

每拆完一个 commit 跑：

```bash
pnpm run typecheck
pnpm run lint
```

涉及 prisma 的组（1、2）另跑 `pnpm run prisma:validate`。
