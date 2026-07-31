# oRPC 前端用法（TanStack Query + oRPC client）

> 本项目前端数据层已从 SWR 迁移到 **TanStack Query + oRPC client**。
> 旧的 `useSWR`/`useSWRMutation`/`useSWRInfinite` 和 `entities/*/api/` 手写 fetch 已全部删除。
> 权威源：`src/shared/lib/orpc/` 实际代码。

## 基础设施

| 文件 | 职责 |
| --- | --- |
| `src/shared/lib/orpc/client.ts` | oRPC typed client（`createORPCClient` + `RPCLink`），类型从后端 `appRouter` 推导 |
| `src/shared/lib/orpc/query-utils.ts` | `orpc` 工具集（`createTanstackQueryUtils`），生成 `queryOptions`/`mutationOptions` |
| `src/shared/lib/orpc/query-keys.ts` | queryKey 工厂（`ruleKeys`/`recordKeys`/`draftKeys` 等），用于 `invalidateQueries` |
| `src/app/providers/query-provider.tsx` | `QueryClientProvider`，全局配置（重试 3 次、失焦不重拉、toast 去重） |

## 读请求：useQuery

```tsx
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/shared/lib/orpc/query-utils";

// 标准 query：queryKey 由 oRPC 按路径自动生成（前缀 = router 路径，如 ["rules"]）
const { data, isLoading } = useQuery({
  ...orpc.rules.getById.queryOptions({ input: { id } }),
});

// 条件查询：enabled 控制
const { data } = useQuery({
  ...orpc.rules.versions.detail.queryOptions({
    input: { ruleId: id, versionId: useVersionId ?? "" },
  }),
  enabled: !!useVersionId,
});
```

> **不要单独传 `queryKey`**——`queryOptions()` 返回的对象已含 queryKey。再传会触发 `queryKey is specified more than once`。

## 写请求：useMutation

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/shared/lib/orpc/query-utils";
import { ruleKeys } from "@/shared/lib/orpc/query-keys";

const qc = useQueryClient();
const { mutateAsync } = useMutation({
  ...orpc.rules.update.mutationOptions(),
  onSuccess: () => qc.invalidateQueries({ queryKey: ruleKeys.all }),
});
await mutateAsync({ id, ...parsed.data }); // input 类型自动推导
```

## 无限滚动：useInfiniteQuery

oRPC 的 `queryOptions` 不支持 infinite，需手动写 `queryFn` 调 `client`：

```tsx
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "@/shared/lib/orpc/client";
import { ruleKeys } from "@/shared/lib/orpc/query-keys";

const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
  queryKey: ruleKeys.infinite({ folderId, spaceId, tagIds, q }),
  queryFn: ({ pageParam }) =>
    client.rules.list({ folderId, spaceId, tagIds, q, page: pageParam + 1, pageSize: 50 }),
  initialPageParam: 0,
  getNextPageParam: (lastPage, _all, lastPageParam) =>
    lastPage.hasMore ? lastPageParam + 1 : undefined,
});
```

哨兵 + 自动翻页用 `useInfiniteLoad` hook（`src/shared/hooks/use-infinite-load.ts`），它接收 `{ hasNextPage, isFetchingNextPage, fetchNextPage }`：

```tsx
const sentinelRef = useInfiniteLoad({ hasNextPage, isFetchingNextPage, fetchNextPage });
```

## 非响应式调用（fire-and-forget / 一次性）

不用 `useQuery`/`useMutation`，直接调 `client`：

```tsx
import { client } from "@/shared/lib/orpc/client";

// 复制全文到剪贴板
const { content } = await client.rules.getById({ id: rule.id });
copy(content);

// 复制计数自增（fire-and-forget）
await client.records.copy({ recordId: id });
```

## queryKey 与缓存失效

### queryKey 前缀 = router 路径

oRPC 自动生成的 queryKey 前缀就是 router 树的路径：
- `orpc.rules.getById` → `["rules", "getById", {input}]`
- `orpc.records.versions.detail` → `["records", "versions", "detail", {input}]`

### 广播失效

`invalidateQueries({ queryKey: ["rules"] })` 会失效所有 rules 相关查询（detail + list + infinite + versions）：

```ts
// ruleKeys.all === ["rules"]，与 oRPC 自动 queryKey 前缀一致
qc.invalidateQueries({ queryKey: ruleKeys.all });
```

`query-keys.ts` 里的 `xxxKeys.all` 值就是 `["xxx"]`，和 oRPC 路径前缀对齐——**直接用 `xxxKeys.all` 做广播失效即可**。

### 常见失效场景

| 场景 | 失效写法 |
| --- | --- |
| 更新规约后 | `qc.invalidateQueries({ queryKey: ruleKeys.all })` |
| 删除收录后 | `qc.invalidateQueries({ queryKey: recordKeys.all })` |
| 内联建文件夹后 | `qc.invalidateQueries({ queryKey: folderKeys.list({...}) })` |
| 导入 skills 后 | `qc.invalidateQueries({ queryKey: discoverSkillKeys.all })` |

> **不再需要 mutate-context**——TanStack 的 `invalidateQueries` 对 `useInfiniteQuery` 也生效，不需要 bound mutate 或 Context 传函数。

## 全局配置（QueryProvider）

`src/app/providers/query-provider.tsx` 配置了：
- `retry: 3`（对齐原 SWR errorRetryCount）
- `refetchOnWindowFocus: false`
- `QueryCache.onError`：失败自动 `toast.error`，按 queryKey 序列化做 toast id 去重
- `QueryCache.onSuccess`：重试成功后 `toast.dismiss`
- `MutationCache.onError`：写操作失败自动 toast

> **业务组件不要重复写失败 toast**——全局 `onError` 已统一处理。

## resourceType 类型收窄

文件夹/标签的 `resourceType` 在 Prisma schema 里是 `String`（非 enum），但 zod schema 是字面量联合。组件 prop 类型必须用派生类型：

```tsx
import type { FolderResourceType } from "@/shared/lib/zod/schemas/folder";
import type { TagResourceType } from "@/shared/lib/zod/schemas/tag";

type Props = { resourceType: FolderResourceType }; // 不要用 string
```

否则 `client.folders.list({ type: resourceType })` 会类型不匹配。

## 反模式

- 用 `useSWR` / `useSWRMutation` / `useSWRInfinite`（已卸载，不存在）。
- 在 `useQuery` 里单独传 `queryKey`（与 `queryOptions()` 返回的冲突）。
- 手写 `fetch("/api/xxx")`（已无旧 REST 端点，走 `client.xxx.yyy()` 或 `orpc.xxx.yyy.queryOptions()`）。
- 用 `entities/*/api/` 手写 fetch 函数（已全部删除）。
- 用 React Context 传 mutate 函数（用 `useQueryClient().invalidateQueries` 替代）。
- 在组件里重复写失败 toast（全局 `QueryCache.onError` 已处理）。
- `as` 断言收窄 resourceType（用正确的派生类型 prop）。
