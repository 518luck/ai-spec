# 表单（react-hook-form + zodResolver）

> 表单用 react-hook-form + `@hookform/resolvers` 的 `zodResolver`；提交通常走 next-safe-action 的 Server Action。

## 基本模式

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { signUpDtoSchema, type SignUpDto } from "@/shared/lib/zod/schemas/auth";
import { useAction } from "next-safe-action/hooks";
import { signUpAction } from "@/server/actions/...";

export function SignUpEmail({ email }: { email: string }) {
  const methods = useForm<SignUpDto>({
    defaultValues: { email },
    resolver: zodResolver(signUpDtoSchema),
  });
  const { execute } = useAction(signUpAction, { onSuccess: ..., onError: ... });

  const onSubmit = methods.handleSubmit((values) => execute(values));

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>{/* 字段用 {...methods.register("email")} 绑定 */}</form>
    </FormProvider>
  );
}
```

## 要点

- 表单值类型从 Dto schema 派生（`useForm<SignUpDto>`），不手写重复类型。
- 校验 schema 来自 `@/shared/lib/zod/schemas/**`，与后端共用同一份 Dto。
- 提交事件用从 `"react"` 导入的 `SubmitEvent<HTMLFormElement>`（见 `shared/code-quality.md`），禁用已弃用的 `FormEvent`。
- Server Action 经 `authUserActionClient`（需登录）或 `actionClient`（无需登录）创建，详见 `backend/server-actions.md`。
- 前端预校验是体验层；后端 action / route handler 是权威防线。
