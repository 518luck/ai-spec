# AGENTS.md

## Server Action 编写规范

本目录用于编写项目的 Server Action。AI 在新增或修改 Server Action 时，必须遵循本项目已有风格，优先参考同目录下现有文件。

## 基本结构

Server Action 文件必须以：

```ts
"use server";
```

开头。

优先使用项目封装好的 safe action client：

```ts
import { actionClient } from "./safe-action";
```

如果 `safe-action.ts` 中已经提供了认证类 client，应根据业务场景优先复用，不要重新实现一套认证逻辑。

## 输入校验

所有外部输入必须通过 `zod/v4` 定义 schema：

```ts
import * as z from "zod/v4";

const schema = z.object({
  email: z.string().email(),
});
```

然后通过 `.inputSchema(schema)` 绑定到 action：

```ts
export const exampleAction = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput }) => {
    const { email } = parsedInput;
  });
```

表单类 action 如果需要返回字段级校验错误，优先使用 `flattenValidationErrors` 写法。

示例：

```ts
"use server";

import { flattenValidationErrors } from "next-safe-action";
import * as z from "zod/v4";
import { actionClient } from "./safe-action";

const schema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(8, "密码至少 8 位"),
});

export const submitFormAction = actionClient
  .inputSchema(schema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .action(async ({ parsedInput }) => {
    const { email, password } = parsedInput;

    return { ok: true };
  });
```

前端可以按字段读取错误：

```ts
const { executeAsync } = useAction(submitFormAction, {
  onError: ({ error }) => {
    toast.error(
      error.serverError ||
        error.validationErrors?.email?.[0] ||
        error.validationErrors?.password?.[0],
    );
  },
});
```

## 标准写法模板

```ts
"use server";

import { prisma } from "@dub/prisma";
import * as z from "zod/v4";
import { actionClient } from "./safe-action";

const schema = z.object({
  name: z.string().min(1),
});

export const exampleAction = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput }) => {
    const { name } = parsedInput;

    const result = await prisma.example.create({
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return result;
  });
```

## 认证和权限

Server Action 必须明确处理认证和权限。

- 登录、注册、找回密码等登录前流程，应使用项目已有的未登录限制中间件。
- 用户登录后才能执行的操作，应使用项目已有认证 client 或认证中间件。
- 资源操作，不要相信前端传入的 `userId`、`role`、`permission`。
- 应优先从服务端上下文读取可信数据。
- 如果需要校验资源归属，必须在服务端查询数据库确认。

## Prisma 查询规范

查询数据库时只取需要字段：

```ts
select: {
  id: true,
  name: true,
}
```

不要无脑返回完整对象，尤其不要返回：

```ts
passwordHash;
token;
secret;
apiKey;
accessToken;
refreshToken;
```

更新成功但前端不需要完整数据时，返回：

```ts
return { ok: true };
```

## 并发和事务

互不依赖的异步操作，使用 `Promise.all`：

```ts
const [user, workspace] = await Promise.all([
  prisma.user.findUnique(...),
  prisma.project.findUnique(...),
]);
```

多个数据库写操作必须保持一致时，使用事务：

```ts
await prisma.$transaction([
  prisma.token.deleteMany(...),
  prisma.token.create(...),
]);
```

## 限流规则

认证、注册、验证码、密码重置、账号探测等敏感 action 必须加限流。

```ts
import { ratelimit } from "@/lib/upstash";

const { success } = await ratelimit(2, "1 m").limit(`key:${email}`);

if (!success) {
  throw new Error("Too many requests. Please try again later.");
}
```

认证相关 action（登录、注册、验证码、密码重置、账号探测等）需要使用 `skipAuthThrottling` 开关，必须先判断该开关；只有在 `!skipAuthThrottling` 时才执行限流，避免开发或测试环境被限流影响。

## 错误处理

直接抛出 `Error`，交给 `actionClient` 的统一错误处理逻辑：

```ts
throw new Error("Workspace not found.");
```

错误文案应简洁、可展示给前端。

不要默认返回：

```ts
return { error: "..." };
```

<!-- TODO: 后续需要可靠队列、重试、消费组或日志管道时，再迁移到 Redpanda。 -->

## 后台任务

不需要阻塞用户请求的任务，应放到响应返回后执行。

当前项目统一使用 Next.js 的 `after`，不要引入 `@vercel/functions` 的 `waitUntil`：

```ts
import { after } from "next/server";

after(async () => {
  await sendEmail(...);
});
```

适合：

- 发送邮件
- 上报日志
- 触发异步 workflow
- 非关键数据同步

## 返回值规范

Server Action 返回值必须是可序列化对象。

推荐：

```ts
return { ok: true };
```

或：

```ts
return {
  id,
  name,
};
```

不要返回：

- Prisma client 实例
- Response 对象
- 函数
- Blob / Stream
- 未过滤的完整数据库对象
- 敏感字段

## 不要混用 API Route

如果是前端内部表单、按钮、设置更新等操作，优先写 Server Action。

只有以下场景才写 `app/api/**/route.ts`：

- 公开 API
- webhook
- OAuth callback
- cron
- 第三方服务回调
- 文件下载或上传签名 URL
- 必须暴露标准 HTTP GET/POST 接口的场景

## 客户端调用规范

客户端组件中优先使用：

```ts
import { useAction } from "next-safe-action/hooks";
```

示例：

```ts
const { executeAsync, isPending } = useAction(exampleAction, {
  onSuccess: () => {
    // success
  },
  onError: ({ error }) => {
    toast.error(error.serverError);
  },
});
```

不要在客户端直接调用 Server Action 函数本体。

## 命名规范

Action 导出名使用动词开头，并以 `Action` 结尾：

```ts
export const createUserAccountAction = ...
export const checkAccountExistsAction = ...
export const requestPasswordResetAction = ...
```

普通内部 helper 不需要加 `Action`。

## 注释规范

- 只在业务意图不明显时写注释。
- 注释解释为什么这么做，不解释 TypeScript 基础语法。
- 安全、限流、权限、事务等逻辑建议补充简短注释。

## 风格要求

- 保持项目已有 import 风格。
- 使用 `parsedInput` 读取已校验输入。
- 使用 `ctx` 读取认证上下文。
- 避免过度封装。
- 避免返回敏感字段。
- 避免绕过 safe-action。
- 避免在 action 中写 UI 逻辑。
- 优先做最小正确改动。
