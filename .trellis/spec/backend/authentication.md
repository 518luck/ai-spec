# 认证与鉴权（NextAuth v5）

> 本项目用 **NextAuth v5**（`next-auth@5.0.0-beta.31`），不是 better-auth。

## 入口

```ts
// src/shared/lib/auth/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
```

配置在 `src/shared/lib/auth/options.ts`。`handlers` 挂在 Next.js Route Handler（`app/api/auth/[...nextauth]/route.ts`）。

## 服务端取 session：auth() 与 resolveContext

- 直接读 session 用 `auth()`（来自 `@/shared/lib/auth/auth`），配合 React `cache()` 做请求级去重。
- Route Handler 内**不要**各处手写 `auth()`，统一经 `resolveContext(req)`（`src/server/middleware/resolve-context.ts`）解析——它同时支持 **cookie session** 与 **API Key** 两种调用方。

```ts
// resolveContext 内部
const cookieSession = await auth();   // 同时尝试 API Key
```

## Route Handler 鉴权：withSession / withPersonal

见 `route-handlers.md`：

- `withSession`（`src/server/middleware/with-session.ts`）：解析"你是谁" + 限流。
- `withPersonal`（`src/server/middleware/with-personal.ts:37`）：叠加套餐额度 / RBAC 权限点校验（权限点校验仅对 API Key 生效）。

二者内部已含日志（`withAxiom`/`withAxiomBodyLog`）与错误归一（`toErrorResponse`）。

## RBAC

权限模型在 `src/server/rbac/`（**注意：不在** `resources.ts`/`permissions.ts`，实际是以下文件）：

| 文件 | 内容 |
| --- | --- |
| `actions.ts` | `ACTION_DEFS`，如 `promptRecord.read` |
| `scopes.ts` | `SCOPES`，含通配 `apis.read` / `apis.all` |
| `resource-ui.ts` | 资源 UI 元信息 |

权限点消费在 `with-personal.ts`（`permissions` 选项）。新增/修改 RBAC 资源、权限动作时，同时检查 `actions.ts` 与 `scopes.ts`，保持资源 key、权限 action 与角色映射一致。

## Server Action 鉴权

Server Action 侧用 next-safe-action 的扩展 client（见 `server-actions.md`）：

- `authUserActionClient`（`src/server/actions/safe-action.ts:31`）：内部 `await auth()` 注入 `ctx.user`，用于需登录的 action。
- `actionClient`（同文件 `:14`）：不带鉴权，用于无需登录的 action（如 `check-login-email`）。

## 客户端 / SSR 鉴权

- Server Component：可直接 `await auth()` 取 session，未登录 `redirect`。
- 受保护页面/路由：在 Route Handler 经 `withPersonal`/`withSession`；页面入口由 `app/` 薄层 + `src/pages` 处理。
- 客户端需登录态时，优先通过受保护接口的响应或 SWR 数据获得，避免在客户端重复实现鉴权逻辑。

## 反模式

- 在 handler 里手写 `getSession()` 而不用 `resolveContext` / 高阶函数。
- 鉴权只做在前端，后端不校验（必须后端权威校验）。
- 认为中间件做了鉴权就够——Route Handler / Server Action 仍须各自校验。
