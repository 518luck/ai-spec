# 后端目录结构

> 权威源：`app/api/AGENTS.md`、`src/shared/lib/AGENTS.md`。

## 顶层分工

```
app/api/**              ← 后端入口：Next.js Route Handler（export GET/POST/...），薄层
src/server/             ← 后端实现
├── middleware/         ← handler 高阶函数：withPersonal / withSession / resolveContext
├── errors/             ← AiSpecError、ErrorCode→HTTP 映射、toErrorResponse
├── rbac/               ← RBAC：actions / scopes / resource-ui
├── actions/            ← next-safe-action Server Actions（safe-action.ts + 各域 action）
└── infrastructure/     ← axiom（日志）/ queue / redis / storage / email 等第三方适配
src/shared/lib/         ← 跨入口共享：auth（NextAuth 配置）/ zod（校验 schema）/ infrastructure / ohs / utils
```

> `src/shared/` 不一定都是前端代码，也可能含后端共享逻辑。修改 `shared/` 下文件前先确认实际用途和调用方，不要默认按前端处理。`shared/db` 是脚本生成的代码，**严禁修改**。

## src/shared/lib 结构（后端基础设施核心）

- `auth/`：NextAuth 配置（`auth.ts` 导出 `auth/handlers/signIn/signOut`）、`options.ts`、OTP/认证常量。
- `zod/schemas/`：跨入口复用的 Zod schema（按业务域拆文件，Dto/Vo 命名，见 `shared/typescript.md`）。
- `ohs/`（Open Host Service）：
  - `ohs/local/appservice/`：应用服务层（用例编排、事务），对应 Server Actions。
  - `ohs/remote/{adapter,controller,routers}/`：HTTP 适配/控制/路由注册薄层。
  - `ohs/pl/`：ports 接口抽象。
- `infrastructure/`：Redis、Axiom、Resend/react-email、BullMQ、环境配置等第三方服务适配。
- `utils.ts`：少量跨模块通用工具。

## 运行环境判断（关键约束）

任何依赖 `next/headers`、`next/server`、`server-only`、Prisma、Redis、Resend、NextAuth 或进程环境变量的模块，**不得被客户端组件直接导入**。修改被客户端和服务端共同引用的文件前，先追踪调用方，避免把服务端依赖带入浏览器运行时。

## 新增代码落点

| 需求 | 落点 |
| --- | --- |
| 新增 HTTP API 入口 | `app/api/**`（Route Handler）|
| 新增 Server Action | `src/server/actions/<域>/`（首行 `"use server"`，复用 `safe-action.ts` 的 client）|
| 新增第三方服务接入 | `src/shared/lib/infrastructure/<服务>/` 对应子目录 |
| 新增共享校验规则 | `src/shared/lib/zod/schemas/`（可被客户端导入，禁引入服务端依赖）|
| 新增 HTTP 适配工具 | `ohs/remote/adapter/`（HTTP 入口仍在 `app/api/**`）|

## 既有路径注意（勿误改）

- `src/shared/lib/infrastructure/redis/reatlimit.ts` 是当前已有路径（拼写如此）；不要新建平行的 `ratelimit.ts`，如需更名必须同步更新所有调用方。
- `infrastructure/email/**` 用 `react-email` 组件体系，父级"优先 shadcn"规则**不适用**于邮件模板。
