# TypeScript 与类型规范

> 继承根 `AGENTS.md`，聚焦类型安全。接口数据类型的完整规则见 `src/shared/lib/zod/AGENTS.md`。

## 核心原则

1. **Zod-first**：先写 Zod schema，再用 `z.infer<typeof xxxSchema>` 推导类型；不手写与 schema 重复的接口类型。
2. **类型从 schema 派生，跨层复用**：前端、API 客户端禁止手写与 Dto/Vo 重复的类型，必须 `import type { XxxVo } from "..."`。组件 props、内部状态等非接口类型不受此约束。
3. **`import type`**：类型专用导入一律用 `import type`（或 `import { type X }`）。
4. **禁类型断言 `as`**：优先通过 zod 解析、类型守卫或函数签名约束获得类型安全；`as const` 等惯用写法除外。

## 禁止

- `any`——用 `unknown` + 收敛，或定义具体类型。
- 非空断言 `!`——用提前返回 / 局部变量收敛 / `??` 回退。
- `@ts-ignore`、`@ts-expect-error`——修根因，不抑制。

```ts
// ❌
const name = user!.name;
const first = items[0]!;
const data = res as User;

// ✅ 提前返回收敛
const user = await findUser(id);
if (!user) throw new AiSpecError({ code: ErrorCode.NOT_FOUND, message: "用户不存在" });
const name = user.name;

// ✅ 索引访问收敛
const first = items[0];
if (!first) return { success: false }; // 或 throw
```

## 接口类型分层（Dto / Vo）

| 后缀 | 含义 | 方向 |
| --- | --- | --- |
| `XxxDtoSchema` / `XxxDto` | 请求入参 | 客户端 → 服务端 |
| `XxxVoSchema` / `XxxVo` | 响应出参 | 服务端 → 客户端 |

- 命名公式：`[操作动词][实体](Dto|Vo)Schema`，动词用 `Create/Update/Patch/Delete/List/Get`，实体单数（列表用复数）。
- 基础字段 schema（如 `emailSchema`、`passwordSchema`）不带 Dto/Vo 后缀，仅供拼装复用。
- 默认 `z.infer` 就地推导；仅当类型被多处引用才显式导出别名（去掉 `Schema` 后缀）。

详细命名、文件内顺序、章节标记见 `src/shared/lib/zod/AGENTS.md`。

## Zod 导入

统一从 `zod/v4` 命名空间导入：

```ts
import * as z from "zod/v4";
```

## 判别联合收敛

判别联合用 `===` 严格相等收敛，不用真值短路：

```ts
type Result<T> = { success: true; data: T } | { success: false; error: string };
if (result.success === true) {
  result.data; // 收敛成功
}
```

## 显式返回类型

对外导出的函数 / 公共 API 优先声明显式返回类型。

## 校验边界

- 外部数据（API 响应、localStorage、用户输入）经 Zod `parse`/`safeParse` 后再使用。
- `zod/**` 可能被客户端导入，**禁止**引入 Prisma、Redis、NextAuth、`next/headers`、`next/server`、`server-only` 或直接读环境变量。

## 类型检查

```bash
pnpm run typecheck   # 不直接跑 tsc
```
