# Server Action 规范

本目录用于项目 React Server Actions、action client 和 action middleware。新增或修改时先参考同目录现有实现，并遵循上级 `AGENTS.md`。

## 核心原则

- React Server Action 必须使用 `next-safe-action` 实现，优先复用 `safe-action.ts` 导出的 `actionClient` 或已有认证/权限 middleware。
- Action 文件必须以 `"use server";` 开头。
- 不要暴露裸 Server Action；不要在客户端组件中直接调用 Server Action 函数本体。
- 客户端组件调用 action 时使用 `useAction` from `next-safe-action/hooks`。
- 导出 action 使用动词开头并以 `Action` 结尾，例如 `createUserAccountAction`。

## 标准形态

```ts
"use server";

import { actionClient } from "./safe-action";

// 提交用户输入并返回最小必要结果
export const submitExampleAction = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput }) => {
    const { name } = parsedInput;

    return { name };
  });
```

表单类 action 需要字段级错误时使用：

```ts
.inputSchema(schema, {
  handleValidationErrorsShape: async (ve) =>
    flattenValidationErrors(ve).fieldErrors,
})
```

## 输入校验

- 所有外部输入必须通过 Zod schema 校验，并通过 `.inputSchema(schema)` 绑定。
- Action 内只读取 `parsedInput`，不要重新信任原始输入。
- 跨入口复用的 schema 放在 `src/shared/lib/zod/schemas/`；action 局部差异可基于共享 schema `extend`。
- 客户端表单校验不能替代服务端 action 校验。

## 认证与权限

- 登录、注册、找回密码等登录前流程，应使用已有未登录限制 middleware。
- 登录后才能执行的操作，应使用已有认证 client 或认证 middleware。
- 不要相信前端传入的 `userId`、`role`、`permission`。
- 可信身份从服务端上下文或 `ctx` 读取；资源归属必须在服务端查询确认。
- 当没有可复用的 client 或 middleware 时，应先告知用户需要补充对应封装。

## 限流与错误

- 认证、注册、验证码、密码重置、账号探测等敏感 action 必须限流。
- 认证相关 action 使用限流前必须先判断 `skipAuthThrottling`；只有 `!skipAuthThrottling` 时才执行限流。
- 业务失败应抛出自定义应用错误（如 `ActionError`），由外层调用方（Server Action 的 `actionClient`、Route Handler 包装器等）统一翻译为可展示文案。
- 不要默认返回 `{ error: "..." }` 对象；让异常自然冒泡，由适配层处理。

## 数据与返回值

- Prisma 查询只 `select` 需要字段，不要返回完整模型。
- 不要返回 `passwordHash`、`token`、`secret`、`apiKey`、`accessToken`、`refreshToken` 等敏感字段。
- 多个相关写操作需要一致性时使用事务；互不依赖的异步操作可用 `Promise.all`。
- 返回值必须可序列化；更新成功且前端不需要数据时返回 `{ ok: true }`。
- 不要返回 Prisma client、Response、函数、Blob、Stream 或未过滤的数据库对象。

## 后台任务

业务后台任务（发邮件、头像同步、异步 workflow 等需可靠执行/重试的）通过 `@/shared/lib/infrastructure/queue` 的 enqueue 助手入队，由独立 worker 进程消费；不要在 action 内直接 `await` 或用 `after` 跑这类任务。

```ts
import { enqueueAvatarSync } from "@/shared/lib/infrastructure/queue";

await enqueueAvatarSync({ userId, imageUrl });
```

Next.js `after` 仅用于请求生命周期内的日志 flush 等轻量操作；不要引入 `@vercel/functions` 的 `waitUntil`。

## Route Handler 边界

前端内部表单、按钮、设置更新等优先使用 Server Action。只有公开 API、webhook、OAuth callback、cron、第三方回调、下载/上传签名 URL 或必须暴露标准 HTTP 接口时，才写 `app/api/**/route.ts`。

## 风格要求

- 保持现有 import 风格和最小正确改动。
- 避免过度封装；不要在 action 中写 UI 逻辑。
- 安全、限流、权限、事务等非平凡逻辑按上级规范补充简短中文注释。
