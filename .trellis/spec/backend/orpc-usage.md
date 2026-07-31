# oRPC 后端用法

> 本项目后端 API 已从 Next.js Route Handler 迁移到 **oRPC**（RPC + OpenAPI 双导出）。
> 旧的 `app/api/*/route.ts` + `withPersonal`/`withSession` 模式已废弃（文件已删除），新接口一律用 oRPC。
> 权威源：`src/server/orpc/` 实际代码、`.trellis/workspace/orpc-migration-map.md`。

## 架构总览

```
app/api/rpc/[...orpc]/route.ts      ← RPC 出口（前端 typed client 用）
app/api/[...openapi]/route.ts       ← OpenAPI 出口（第三方 REST 用，路径靠 .route() 声明）
app/api/openapi-spec/route.ts       ← OpenAPI 规范导出（给第三方生成 SDK）
        │ 挂载
src/server/orpc/router.ts           ← appRouter：聚合所有领域子 router
        │ 调用
src/server/orpc/routers/<领域>.ts   ← procedure 编排层（input → service → output）
        │ 调用
src/server/domain/<领域>/services/  ← service 业务逻辑（纯 Prisma + 业务规则）
```

**三层职责**：
- **挂载点**（`app/api/rpc`、`app/api/[...openapi]`）：薄层，只做 `handler.handle(request, {prefix, context})` + `after(() => logger.flush())`。不写业务。
- **procedure 编排层**（`src/server/orpc/routers/`）：鉴权（`personalProcedure`）→ `.input(dto)` → 调 service 函数 → `.output(vo)`。**不写 Prisma 查询**。
- **service 层**（`src/server/domain/<领域>/services/`）：所有业务逻辑、Prisma 操作、事务、diff/版本。**不碰 HTTP / oRPC 框架**，可被 procedure / server action / 队列复用。

## service 层组织：每个用例一个文件

> **禁止**把一个领域的所有方法塞进一个 `xxx-service.ts` 对象。每个用例（query/command）独立一个文件，导出一个 `async` 函数。

```
src/server/domain/prompt/records/services/
├── list-records.ts              ← export const listRecords = async ({...}) => {...}
├── create-record.ts             ← export const createRecord = async ({...}) => {...}
├── get-record-by-id.ts          ← export const getRecordById = async ({...}) => {...}
├── update-record.ts             ← import { updateRecordAndVersion } from "./update-record-and-version"
├── delete-record.ts
├── favorite-record.ts
├── unfavorite-record.ts
├── copy-record.ts
├── update-record-and-version.ts ← 版本记录逻辑（update 委托给它）
├── list-record-versions.ts
├── get-record-version-detail.ts
└── index.ts                     ← barrel：export { listRecords } from "./list-records"; ...
```

命名约定：
- 文件名 `<动词>-<名词>.ts`（kebab-case），如 `list-records.ts`、`create-rule.ts`
- 函数名 `动词+名词`（camelCase），如 `listRecords`、`createRule`、`getRuleById`
- 跨领域共用的工具函数放 `src/server/utils/`（如 `mapTags`、`mapEditor`、`diff`）
- 仅同领域多文件共用的类型，由主用例文件导出、另一文件 import（如 `RuleUpdatePatch` 由 `update-rule-and-version.ts` 导出，`update-rule.ts` 导入）

## 新增端点的标准流程

以"给 records 加一个新接口"为例：

### 1. 先写 service（`src/server/domain/prompt/records/services/my-new-record.ts`）

```ts
// 一个文件一个函数，显式标注 Promise<XxxVo> 返回类型
export const myNewRecord = async ({ userId, id }: { userId: string; id: string }): Promise<XxxVo> => {
  const record = await prisma.promptRecord.findFirst({ where: { id, ownerId: userId } });
  if (!record) throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "收录不存在" });
  return { ...record };
};
```

### 2. 在 barrel 导出（`src/server/domain/prompt/records/services/index.ts`）

```ts
export { myNewRecord } from "./my-new-record";
```

### 3. 再写 procedure（`src/server/orpc/routers/records.ts` 的 `recordsRouter` 里加键）

```ts
import "@orpc/openapi/extensions/route"; // 文件顶部，启用 .route() 扩展
import { myNewRecord } from "@/server/domain/prompt/records/services"; // 从 barrel 导入函数

export const recordsRouter = {
  myNewRecord: personalProcedure({ permissions: ["promptRecord.read"] })
    .route({ method: "GET", path: "/prompt/records/{id}/my-new" }) // OpenAPI 路径声明
    .input(z.object({ id: z.string() }))     // 入参 Dto
    .output(xxxVoSchema)                      // 出参 Vo
    .handler(async ({ input, context }) => {
      return myNewRecord({                    // 直接调函数，不是 xxxService.method
        userId: context.session.user.id,      // 从 context 拿身份
        id: input.id,
      });
    }),
};
```

### 3. 如果是新领域，挂载到 appRouter（`src/server/orpc/router.ts`）

```ts
import { myDomainRouter } from "./routers/my-domain";
export const appRouter = { ..., myDomain: myDomainRouter };
```

## procedure 类型选择

| procedure 工厂 | 鉴权 | 用途 |
| --- | --- | --- |
| `protectedProcedure` | 强制登录（session.user.id 必有） | 通用受保护接口（如 user.update） |
| `personalProcedure()` | 强制登录 + 可选 scope | 个人空间接口（无 RBAC scope 要求） |
| `personalProcedure({ permissions: ["xxx.read"] })` | 强制登录 + API Key scope 校验 | 带 RBAC 的个人空间接口 |

> `personalProcedure` = `protectedProcedure` + `requireScope`。scope 校验仅对 API Key 接入生效（cookies 靠 ownerId 隔离）。
> 当前 scope 校验**不做通配展开**（`apis.all`/`apis.read` 不自动满足资源级 permission），照搬现状。

## context 结构

```ts
type ORPCContext = {
  request: NextRequest;       // 原始请求（cookies/session 依赖它）
  session?: Session;          // authProvider 注入（next-auth Session，含 user.id）
  rateInfo?: RateLimiterRes | null;  // API Key 限流信息
  scopes?: string[] | null;   // API Key scope 数组；cookies 分支为 null
  authLoaded?: boolean;       // dedupe 标志（避免重复解析身份）
};
```

handler 里通过 `context.session.user.id` 拿当前用户 ID。**不要在 handler 里调 `resolveContext`**——authProvider 中间件已解析并注入。

## 错误处理

- **业务错误继续抛 `AiSpecError`**（`throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message })`）。
- `errorInterceptor`（在挂载点注册）会捕获并转成 `ORPCError`，保留 8 个错误码。
- **禁止**在 handler 里手动抛 `ORPCError`——用 `AiSpecError` 保持错误体系统一。
- ZodError（手 safeParse 失败）和 Prisma P2025 也会被 interceptor 自动归一化。

## OpenAPI 路径声明（`.route()`）

每个 procedure 用 `.route({ method, path, successStatus? })` 声明 HTTP 暴露：
- `method`：GET/POST/PUT/PATCH/DELETE
- `path`：REST 风格路径，动态段用 `${id}` 语法，如 `/prompt/records/{id}/versions/{versionId}`
- `successStatus`：创建类用 `201`，其余默认 `200`
- 顶部必须 `import "@orpc/openapi/extensions/route"` 启用 `.route()` 扩展

> 前端 RPC 出口不需要 `.route()`（按 router 树路径路由），但 OpenAPI 出口（第三方）依赖它。
> **每个 procedure 都要写 `.route()`**——即使前端不用，第三方也需要。

## zod schema 复用

- 入参用现有 Dto schema（`listRecordsDtoSchema` / `createRecordDtoSchema` 等），不要重新定义。
- 路径参数 + Dto 合并：`z.object({ id: z.string() }).extend(xxxDtoSchema.shape)`。
- GET 列表的分页参数保留 `z.coerce.number()`（searchParams 永远是 string）。
- 出参用现有 Vo schema。
- service 方法的返回类型显式标注为 `Promise<XxxVo>`（让 `.output()` 编译期校验通过）。

## 拦截器链

挂载点注册了 3 个拦截器（顺序敏感）：

```ts
new RPCHandler(appRouter, {
  interceptors: [loggingInterceptor, rateLimitHeaderInterceptor, errorInterceptor],
});
```

| 拦截器 | 职责 |
| --- | --- |
| `loggingInterceptor` | 请求级日志（method/path/status），平移 `withAxiomBodyLog` |
| `rateLimitHeaderInterceptor` | API Key 接口补 `X-RateLimit-*`/`Retry-After` 响应头 |
| `errorInterceptor` | 错误归一化（AiSpecError/ZodError/Prisma → ORPCError）|

> `after(() => logger.flush())` 在挂载点的 route handler 里调（不在拦截器里——`after()` 在 oRPC handler 内部不可用）。

## 保留的旧入口（不迁移到 oRPC）

| 入口 | 原因 |
| --- | --- |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handlers，oRPC 身份依赖它 |
| `app/api/search/route.ts` | fumadocs 非 JSON 二进制响应 |
| `app/api/debug/*/route.ts` | 调试端点 |
| `src/server/actions/auth/*`、`token/*` | next-safe-action，保留（auth/token 不迁 oRPC）|

## 反模式

- 在 procedure handler 里写 Prisma 查询（应放 service）。
- 在 service 里 import oRPC / Next.js 类型（service 应框架无关）。
- **把多个用例塞进一个 `xxx-service.ts` 对象**（`export const xxxService = { list(){}, create(){} }`）——每个用例一个文件，导出独立 `async` 函数。
- **在 procedure 里用 `xxxService.method()` 调用**——直接调函数 `xxxMethod()`。
- 手动抛 `ORPCError` 而非 `AiSpecError`。
- 在 handler 里调 `resolveContext`（已由 authProvider 中间件处理）。
- 新增 Route Handler（`app/api/*/route.ts`）——新接口一律用 oRPC procedure。
- 用 `declare module "@orpc/server"` 注册错误码——会破坏 `os`/`ORPCError` 类型导出（已知 bug），用字符串 code + `AiSpecError` 即可。
- `as` 类型断言收窄 resourceType——用 zod `parse` 或 `satisfies`（Prisma schema 用 String 非 enum 导致类型损失，在 service 返回处用 `xxxVoSchema.parse()` 校验收窄）。

## 包版本

- oRPC 全系列 `@beta`（当前 `2.0.0-beta.23`）
- `@tanstack/react-query` 稳定版 `5.101.4`（与 oRPC 的 query-core 对齐，不要用 beta）
- `@standardserver/*`（oRPC 间接依赖，需作为直接依赖显式安装以 hoist 类型）
