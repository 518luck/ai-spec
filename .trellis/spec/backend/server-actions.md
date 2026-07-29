# Server Actions（next-safe-action）

> 用 next-safe-action v8。权威源：`src/shared/lib/AGENTS.md`。

## 基础 client

`src/server/actions/safe-action.ts` 定义两个 client：

| client | 定义 | 用途 |
| --- | --- | --- |
| `actionClient` | `:14` | 不带鉴权（如 `check-login-email`）|
| `authUserActionClient` | `:31` | 内部 `await auth()` 注入 `ctx.user`，需登录的 action |

```ts
// src/server/actions/token/create-token.ts
"use server";
import { authUserActionClient } from "@/server/actions/safe-action";
import { createTokenDtoSchema } from "@/shared/lib/zod/schemas/token";

export const createTokenAction = authUserActionClient
  .schema(createTokenDtoSchema)
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user 已注入
    // ...
  });
```

## 要点

- 文件首行保留 `"use server"`。
- 入参用 Dto schema（`.schema(createTokenDtoSchema)`），next-safe-action 自动校验。
- 需登录的 action 用 `authUserActionClient`；无需登录用 `actionClient`。
- 前端用 `useAction`（`next-safe-action/hooks`）调用，配合 react-hook-form（见 `frontend/forms.md`）。
- App Service 层（用例编排、事务）对应 `src/shared/lib/ohs/local/appservice/`；新增 Server Action 放 `src/server/actions/<域>/`，复用 `safe-action.ts` 的 client 处理输入校验和服务端错误。

## 与 Route Handler 的选择

- Server Action：表单提交、RSC 内的变更操作、需要 `revalidatePath` 的场景。
- Route Handler：需要稳定 URL、被外部/API Key 调用、或明确的 REST 语义。

## 反模式

- 在 Server Action 里手写 session 读取（用 `authUserActionClient`，`ctx.user` 已注入）。
- 重复定义已有 client 而不复用 `actionClient`/`authUserActionClient`。
- 在 action 内手写错误响应——抛 `AiSpecError`，由统一机制归一。
