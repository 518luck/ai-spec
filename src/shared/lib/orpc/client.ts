// # oRPC 前端 client：连接 /api/rpc 出口，端到端类型安全

import { createORPCClient } from "@orpc/client"; //返回一个类型化的 proxy 对象（即下面的 client），让你能像调普通函数一样调远程接口。
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { appRouter } from "@/server/orpc/router";

// RPC link：同源走 /api/rpc，credentials: include 确保带 cookies session
// 相当于配置对象
const link = new RPCLink({
	url: "/api/rpc",
	fetch: (request, init) => globalThis.fetch(request, { ...init, credentials: "include" }),
});

// 类型化 client：类型从后端 appRouter 自动推导
export const client: RouterClient<typeof appRouter> = createORPCClient(link);
