// # oRPC + TanStack Query 集成：从类型化 client 生成 query/mutation options

import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { client } from "./client";

// 工具集：orpc.rules.list.queryOptions(...) / orpc.rules.create.mutationOptions() 等
// 配合标准 useQuery/useMutation/useInfiniteQuery 使用（oRPC 官方 @beta 推荐模式）
export const orpc = createTanstackQueryUtils(client);
