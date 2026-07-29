# 前端类型安全

> 通用类型规则见 `shared/typescript.md`。接口数据类型规则见 `src/shared/lib/zod/AGENTS.md`。

## 类型从 schema 派生，不手写重复

- 接口入参/出参类型从 Dto/Vo schema 派生（`z.infer<typeof xxxDtoSchema>`），或 `import type { XxxVo } from "..."`。
- **禁止**在 UI 组件、API 客户端手写与 Dto/Vo 重复的类型——schema 改字段时全链路必须自动更新。
- 组件 props、内部状态等非接口类型不受此约束，可本地定义。

```ts
// ✅ 复用 schema 类型
import type { DraftVo } from "@/shared/lib/zod/schemas/...";
function RecordCard({ record }: { record: DraftVo }) { /* ... */ }

// ❌ 手写重复类型
interface DraftVo { id: string; name: string; /* ... */ }
```

## 外部数据校验

外部数据（API 响应、localStorage、URL 参数）经 Zod `parse`/`safeParse` 后再使用：

```ts
function getStored<T>(key: string, schema: z.ZodType<T>): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return schema.parse(JSON.parse(raw)); } catch { return null; }
}
```

## Server → Client props 序列化

跨 RSC/Client 边界的 props 必须可序列化：无 `Date` 对象、函数、`Map`/`Set`、类实例；`Date` 先转 ISO 字符串。

## 禁止

- `any` / 非空断言 `!` / `@ts-ignore` / `@ts-expect-error`（见 `shared/code-quality.md`）。
- 盲类型断言 `data as User`——用 `schema.parse(data)` 或类型守卫。

## View Model 类型

前端需要派生/计算字段时，基于后端类型扩展而非重定义：

```ts
import type { OrderVo } from "@/shared/lib/zod/schemas/...";
export interface OrderViewModel extends OrderVo {
  formattedTotal: string;
  isEditable: boolean;
}
```
