# 数据请求（SWR）—— ⚠️ 已废弃

> **本文档描述的 SWR 模式已废弃**。项目已迁移到 TanStack Query + oRPC client。
> 新代码请遵循 [orpc-usage.md](./orpc-usage.md)。本文档保留仅作历史参考。

> 本项目用 **SWR**（非 React Query）。权威源：`src/AGENTS.md`。

## 全局配置

在 `src/app/providers/swr-provider.tsx` 经 `<SWRConfig>` 注入默认值：

- `revalidateOnFocus: false`（失焦不自动重拉）
- `errorRetryCount: 3`（封顶避免无限打扰）
- `onError`：失败自动 `toast.error`，并按序列化 key 做 toast id 去重
- `onSuccess`：重试成功后 `toast.dismiss`

> 因此**业务组件不要重复写失败 toast**——全局 `onError` 已统一处理。

## 基本用法

组件直接 `useSWR(key, fetcher)`：

```ts
import useSWR from "swr";
import { getFolders } from "@/entities/folder";

// 列表/详情 key 用数组
useSWR(["folders", resourceType, spaceId], () => getFolders({ resourceType, spaceId }));
useSWR(["tags", resourceType], () => getTags(resourceType));

// 详情
useSWR(["record", id], () => getRecord(id));

// 条件查询：key 为 null 时不发请求
useSWR(open ? (["record", id] as const) : null, () => getRecord(id));
```

## fetcher

请求封装在 `entities/<entity>/api/`（如 `src/entities/folder/api/folder.ts`），经 slice 的 `index.ts` 导出。fetcher 只负责传输，**不做权威校验**，但入参/出参**类型必须从 Dto/Vo schema 派生**。

## 何时偏离全局配置

仅确实需要偏离时才传局部配置（如自定义 `revalidateOnFocus`、`dedupingInterval`）。默认行为已覆盖绝大多数场景。

## 请求层校验边界

| 层 | 职责 |
| --- | --- |
| 后端 route handler / server action | **唯一权威防线**，必须用 Dto 校验入参、Vo 校验出参 |
| 前端 UI | 提交前预校验（RHF 用 `zodResolver`，简单输入用 `safeParse` + toast）|
| 前端 API 客户端（`entities/*/api`）| 只传输，不权威校验；类型从 Dto/Vo 派生 |

## 反模式

- 用 React Query / 自研数据层。
- 在组件里重复写失败 toast（全局已处理）。
- 用字符串 key 而非数组 key 表达多维查询（多维查询用数组 key，便于去重与失效）。
- fetcher 里手写与 Dto/Vo 重复的类型。

> RSC 直查不经 API 端点、无响应体，其 Vo schema 可仅作前端类型来源，不视为死 schema。
