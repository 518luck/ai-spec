# Route Handler —— ⚠️ 已废弃（新接口用 oRPC）

> **本文档描述的 Route Handler + `withPersonal`/`withSession` 模式已废弃**。项目已迁移到 oRPC。
> 新接口一律用 oRPC procedure，**禁止**新增 Route Handler。请遵循 [orpc-usage.md](./orpc-usage.md)。
> 本文档保留仅说明旧模式（`withPersonal`/`withSession`/`withAxiomBodyLog` 的鉴权链路仍被保留的入口如 auth/debug 参考）。

> 后端 API 入口是 Next.js Route Handler（`export const GET/POST/DELETE`）。权威源：`app/api/AGENTS.md`、`src/server/infrastructure/axiom/AGENTS.md`。

## 标准模式：用高阶函数包裹

不要裸写 handler。用 `withPersonal` 或 `withSession` 包裹业务函数——它们**内部已经组合了** `withAxiomBodyLog`/`withAxiom`（日志）+ session 解析 + 限流 + 错误归一：

```ts
// app/api/folders/route.ts
import { withPersonal } from "@/server/middleware/with-personal";

// 读取文件夹列表
export const GET = withPersonal(async ({ session, searchParams }) => {
  const folders = await prisma.folder.findMany({ where: { ownerId: session.user.id } });
  return NextResponse.json({ folders });
});
```

包裹链路（真实定义位置）：

| 高阶函数 | 定义 | 内部能力 |
| --- | --- | --- |
| `withPersonal` | `src/server/middleware/with-personal.ts` | `withAxiomBodyLog` + session 解析（`resolveContext`）+ 套餐/权限点校验 + `toErrorResponse` 归一 |
| `withSession` | `src/server/middleware/with-session.ts` | `withAxiom` + "你是谁" + 限流 |

`withAxiomBodyLog` / `withAxiom` 定义在 `src/server/infrastructure/axiom/server.ts`。

## 选择 withPersonal 还是 withSession

- `withSession`：只需知道"调用者是谁" + 限流。
- `withPersonal`：在 `withSession` 基础上叠加套餐额度 / RBAC 权限点校验（对 API Key 调用生效）。

## 入参 / 出参校验

- **入参**（GET `searchParams`、POST/PUT/PATCH `body`）用 **Dto schema** 校验后再用。
- **出参**（响应体）用 **Vo schema** 校验后再返回，不要直接返回裸数据。
- 均经 Zod 校验，不要解构裸数据。详见 `shared/typescript.md` 与 `type-safety.md`。

## 错误处理

- 业务错误**统一抛 `AiSpecError`**（见 `error-handling.md`）。
- **禁止**在 handler 里手写 `NextResponse.json({ error: ... })`——`withPersonal`/`withSession` 会 catch 并经 `toErrorResponse` 统一返回 `{ error: { message, code } }`。

## 日志

正式日志用 `createLogger(module)`，不用 `console.log`（详见 `logging.md`）。Route Handler 的请求/响应体日志已由 `withAxiomBodyLog` 自动处理。

## 反模式

- 裸 `export const GET = async (req) => {...}`（未经日志/鉴权/错误归一）。
- 在 handler 手写错误 JSON。
- 直接解构未校验的 `searchParams` / `body`。
- 直接返回 Prisma 裸对象（不经 Vo 校验/转换）。
