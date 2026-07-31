# oRPC 迁移映射表（现状 → 目标）

> 基于对 25 路由 + 19 处 SWR 调用 + 全量 zod schema + 基础设施的穷举摸底。
> 12 条决策见对话记录。本文档是实施的权威依据。

## 一、不迁移的路由（保留原样）

| 路由 | 原因 |
|---|---|
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handlers，oRPC 身份依赖它，保留 |
| `app/api/search/route.ts` | fumadocs 非 JSON 二进制响应，保留独立 endpoint |
| `app/api/debug/axiom/route.ts` | 调试用，保留或删（无业务依赖） |
| `app/api/debug/email/route.ts` | 调试用，保留或删（无业务依赖） |

## 二、后端 procedure 路由树（目标）

挂载点（薄层，2 个 catch-all）：
- `app/api/rpc/[...orpc]/route.ts` → `RPCHandler`（前端 typed client）
- `app/api/[...openapi]/route.ts` → `OpenAPIHandler`（第三方 REST，靠 `.route()` 声明路径）

router 定义位置：`src/server/orpc/routers/`，聚合在 `src/server/orpc/router.ts`。

### rules 领域（10 个端点 → procedures）
| 现端点 | procedure 名 | input Dto | output Vo | service | 难度 | 特殊 |
|---|---|---|---|---|---|---|
| GET /api/rules | `rules.list` | listRulesDtoSchema | ruleListVoSchema | ruleService.list | 简单 | space 归属推导（getOrCreatePersonalRuleSpace）|
| POST /api/rules | `rules.create` | createRuleDtoSchema | ruleVoSchema | ruleService.create | 简单 | folder→spaceId 联动 |
| GET /api/rules/[id] | `rules.getById` | {id} | ruleContentVoSchema | ruleService.getById | 简单 | |
| PUT /api/rules/[id] | `rules.update` | updateRuleDtoSchema+{id} | ruleVoSchema | ruleService.update + **versionService** | **复杂** | 标签 deleteMany+create 事务 + 每10版快照 diff |
| DELETE /api/rules/[id] | `rules.delete` | {id} | void | ruleService.delete | 简单 | |
| DELETE /api/rules/batch | `rules.deleteMany` | {ids:string[]} 内联→补 Dto | {success,deletedCount} | ruleService.deleteMany | 简单 | 补正式 Dto schema |
| GET /api/rules/spaces | `ruleSpaces.list` | — | ruleSpaceListVoSchema | ruleSpaceService.list | 简单 | permissions:[rules.read] |
| POST /api/rules/spaces | `ruleSpaces.create` | createRuleSpaceDtoSchema | ruleSpaceVoSchema | ruleSpaceService.create | 简单 | 同名查重 CONFLICT；permissions:[rules.write] |
| GET /api/rules/[id]/versions | `rules.versions.list` | listVersionsDtoSchema+{ruleId} | versionListVoSchema | versionService.list | 中等 | 跨域复用 record 版本 schema |
| GET /api/rules/[id]/versions/[versionId] | `rules.versions.detail` | {ruleId,versionId} | versionDetailVoSchema | versionService.getDetail | **复杂** | 快照+diff 链式重建 |

### prompt/records 领域（10 个端点）
| 现端点 | procedure 名 | input | output | service | 难度 |
|---|---|---|---|---|---|
| GET /api/prompt/records | `records.list` | listRecordsDtoSchema | recordListVoSchema | recordService.list | 中等(raw SQL+HN排序+favorite批查) |
| POST /api/prompt/records | `records.create` | createRecordDtoSchema | createRecordVoSchema | recordService.create | 中等(内联建v1快照) |
| GET /api/prompt/records/[id] | `records.getById` | {id} | recordContentVoSchema | recordService.getById | 简单 |
| PATCH /api/prompt/records/[id] | `records.update` | updateRecordDtoSchema+{id} | createRecordVoSchema | recordService.update + versionService | **复杂**(事务+版本) |
| DELETE /api/prompt/records/[id] | `records.delete` | deleteRecordDtoSchema | void | recordService.delete | 简单 |
| GET /records/[id]/versions | `records.versions.list` | listVersionsDtoSchema+{recordId} | versionListVoSchema | versionService.list | 中等 |
| GET /records/[id]/versions/[v] | `records.versions.detail` | {recordId,versionId} | versionDetailVoSchema | versionService.getDetail | **复杂**(重建) |
| POST /records/[id]/favorite | `records.favorite` | {id} | favoriteToggleVoSchema | recordService.toggleFavorite | 简单(手动幂等) |
| DELETE /records/[id]/favorite | `records.unfavorite` | {id} | favoriteToggleVoSchema | recordService.toggleFavorite | 简单 |
| POST /records/[id]/copies | `records.copy` | {id} | {success} | recordService.incrementCopy | 简单(updateMany自增) |

### prompt/drafts 领域（5 个端点）
| 现端点 | procedure 名 | input | output | service | 难度 |
|---|---|---|---|---|---|
| GET /api/prompt/drafts | `drafts.list` | listDraftsDtoSchema | draftListVoSchema | draftService.list | 中等(raw SQL) |
| POST /api/prompt/drafts | `drafts.create` | createDraftDtoSchema | createDraftVoSchema | draftService.create | 简单 |
| GET /api/prompt/drafts/[id] | `drafts.getById` | {id} | draftContentVoSchema | draftService.getById | 简单 |
| PATCH /api/prompt/drafts/[id] | `drafts.update` | updateDraftDtoSchema+{id} | createDraftVoSchema | draftService.update | 简单(无事务无版本) |
| DELETE /api/prompt/drafts/[id] | `drafts.delete` | deleteDraftDtoSchema | void | draftService.delete | 简单 |

### discover/skills 领域（4 个端点）
| 现端点 | procedure 名 | input | output | service | 难度 |
|---|---|---|---|---|---|
| GET /api/discover/skills | `discoverSkills.list` | listDiscoverSkillsDtoSchema | discoverSkillListVoSchema | discoverSkillService.list | 中等(license白名单+AND/OR) |
| GET /discover/skills/organizations | `discoverOrganizations.list` | — | organizationListVoSchema | discoverSkillService.listOrganizations | 中等(raw SQL GROUP BY) |
| POST /discover/skills/import | `discoverSkills.import` | importDiscoverSkillsDtoSchema | importDiscoverSkillsVoSchema | **importRepoSkills（已有）** | **最复杂**(GitHub抓取+upsert+prune) |
| POST /discover/skills/[id]/report | `discoverSkills.report` | reportDiscoverSkillDtoSchema+{id} | reportDiscoverSkillVoSchema | createDiscoverSkillReport（已有）+应用级限流 | 中等 |

### folders / tags 领域（4 个端点）
| 现端点 | procedure 名 | input | output | service | 难度 |
|---|---|---|---|---|---|
| GET /api/folders | `folders.list` | {type,spaceId} 补 Dto | folderListVoSchema | folderService.list | 简单(补 zod) |
| POST /api/folders | `folders.create` | createFolderDtoSchema | folderOptionVoSchema | folderService.create | 简单 |
| GET /api/tags | `tags.list` | {type} 补 Dto | tagListVoSchema | tagService.list | 简单(补 zod) |
| POST /api/tags | `tags.create` | createTagDtoSchema | tagOptionVoSchema | tagService.upsert | 简单(upsert 语义) |

### user 领域（1 个端点，唯一 withSession）
| 现端点 | procedure 名 | input | output | service | 难度 |
|---|---|---|---|---|---|
| PATCH /api/user | `user.update` | updateUserDtoSchema | userVoSchema | userService.update | 中等(S3头像+邮件验证+队列) |

## 三、共享 service / procedure（跨域复用）

| 模块 | 位置 | 用途 |
|---|---|---|
| versionService | `src/server/domain/shared/version-service.ts` | diff/snapshot/重建，rules + records 共用（消除两套重复） |
| version schema | `src/shared/lib/zod/schemas/version.ts`（新） | 从 prompt/record.ts 抽出版本相关 schema，rules/records 共用 |
| tagService.upsert | `src/server/domain/tag/` | tags POST 的 upsert |
| mapTags / decodeFilters | 保持原位 | 工具函数 |

## 四、鉴权迁移映射

| 现状 | 目标（oRPC） |
|---|---|
| `resolveContext(req)` | `createORPCContext({request})` 原样调用，返回 `{session,rateInfo,scopes,request}` |
| `withPersonal(handler,{permissions})` | `authMiddleware`（解析身份）+ `requireScope(permissions)` 中间件链 |
| `withSession(handler)`（限流头） | `authMiddleware` + 外层 route handler 写限流头（所有 API Key 接口都补） |
| AiSpecError 抛出 | procedure 内继续 `throw new AiSpecError(...)` |
| toError 归一化 | oRPC error interceptor 捕获 → 转 ORPCError（保留 8 个 code 注册到 Registry）|
| after(log.flush()) | 挪到外层 route handler 的 after()，interceptor 内只 log.xxx |
| withAxiomBodyLog | oRPC logging interceptor（记 parsed input + status）|

### oRPC context 类型
```ts
type ORPCContext = {
  request: NextRequest;
  session: Session;          // next-auth Session（含 user.id）
  rateInfo: RateLimiterRes | null;
  scopes: string[] | null;   // null=cookies 分支，跳过 scope 校验
};
```

## 五、queryKey 重设计（前端，统一三层）

| 当前 SWR key | 新 TanStack queryKey |
|---|---|
| `["rule", id]` | `["rules", "detail", { id }]` |
| `["rules", folderId, spaceId, tagIds, q, page, pageSize]` | `["rules", "list", { folderId, spaceId, tagIds, q, page, pageSize }]` |
| `["rules-infinite", folderId, spaceId, tagIds, q, pageIndex]` | `["rules", "infinite", { folderId, spaceId, tagIds, q }]` |
| `["rule-version-detail", id, useVersionId]` | `["rules", "versionDetail", { ruleId, versionId }]` |
| `"rule-spaces"` | `["ruleSpaces", "list"]` |
| `["record", id]` | `["records", "detail", { id }]` |
| `["records", ..., pageIndex]` (infinite) | `["records", "infinite", { folderId, tagIds, q, filter, favorite, sort }]` |
| `["version-detail", id, useVersionId]` | `["records", "versionDetail", { recordId, versionId }]` |
| `["draft", id]` | `["drafts", "detail", { id }]` |
| `["drafts", ..., pageIndex]` (infinite) | `["drafts", "infinite", { q, filter, folderId }]` |
| `["folders", resourceType, spaceId]` | `["folders", "list", { resourceType, spaceId }]` |
| `["tags", resourceType]` | `["tags", "list", { resourceType }]` |
| `["discover-skills", q, filter, orgs, minStars, pageIndex]` | `["discoverSkills", "infinite", { q, filter, orgs, minStars }]` |
| `["discover-organizations"]` | `["discoverOrganizations", "list"]` |
| `["versions", resourceId, pageIndex]` | `["versions", "infinite", { resourceType, resourceId }]`（加 resourceType 防撞） |
| `["version-content", resourceId, versionId]` | `["versions", "content", { resourceType, resourceId, versionId }]` |

### 失效逻辑迁移
| 现状 mutate | 新 invalidateQueries |
|---|---|
| `mutate(k => k[0]==="rules")`（漏刷 infinite，Bug-1） | `qc.invalidateQueries({ queryKey: ["rules"] })`（自动含 infinite，bug 消失） |
| `mutate(k => k[0]==="rule"\|\|"rules")` | `qc.invalidateQueries({ queryKey: ["rules"] })` |
| RecordsMutateProvider/DraftsMutateProvider | **删除 Context**，消费点改 `qc.invalidateQueries({ queryKey: ["records"] })` |
| bound mutate()（folder/tag/space combobox） | `qc.invalidateQueries({ queryKey: ["folders","list",{...}] })` |

## 六、特殊处理项（迁移时必看）

1. **searchParams 的 coerce 保留**：listRulesDto/listRecordsDto/listDraftsDto/listDiscoverSkillsDto/listVersionsDto 的 `z.coerce.number()/boolean()` 不能去掉（GET 的 searchParams 永远是 string）。
2. **`.default([])` 的 input/output 类型差异**：recordImagesSchema/draftImagesSchema/tokenScopesSchema，oRPC input 类型可选、output 必填。
3. **transform 影响 OpenAPI 文档**：emailSchema（小写化）、reportDiscoverSkillDtoSchema.detail（空串→undefined）的 transform 不进 OpenAPI 文档，但运行时生效。
4. **z.iso.datetime() vs z.date()**：tokenVoSchema.expires 用 z.date()（Date 对象），但 token 不迁 oRPC（保留 action），无影响。
5. **strictObject 在 dev 严格**：Vo schema 必须覆盖后端实际返回的所有字段，否则 dev 下 .output() parse 失败。
6. **discover/skills/import 复用现有 importRepoSkills**：已在 `src/server/domain/discover/skills/services/sync.ts`，procedure 直接调，零改动。队列同步任务也调它，保持单一来源。
7. **version-page 通用页**：records 和 rules 共用 VersionPage 组件，注入式 fetcher。迁移时 key 加 resourceType 区分。
8. **recordCopy / updateUser（部分调用）不走 SWR**：fire-and-forget，保持裸 await，不迁 useMutation。

## 七、测试目录结构（目标）

```
tests/
├── server/
│   ├── orpc/              # procedure 契约测试（输入→输出）
│   └── domain/            # service 层单测（重构安全网，优先）
│       ├── rules/
│       ├── prompt/
│       ├── discover/
│       └── shared/        # version-service 测试（diff/重建）
├── client/                # 前端 hooks 测试（MSW mock）
└── shared/                # 错误体系、zod schema 测试
```

## 八、实施批次顺序（依赖优先）

1. **批次 0：oRPC 骨架**（无业务）—— context/procedures 基类/挂载点/双导出/QueryClientProvider/错误 interceptor/日志 interceptor
2. **批次 1：试点 rules 全链路**（router + service + query + 测试）—— 验证骨架跑通
3. **批次 2：剩余后端**（prompt/discover/folders/tags/user）
4. **批次 3：前端数据层**（80 处 useSWR → useQuery + queryKey 重建 + 删 mutate-context）
5. **批次 4：收尾**（卸载 SWR + typecheck + lint + 手动验证 + 删旧 route.ts/entities/api）

## 九、后续计划（本次不做，记录待办）

- **RBAC 通配展开**（Bug-2）：scope middleware 里 apis.all→跳过全部校验，apis.read→跳过 *.read。本次照搬现状 includes 逻辑。
