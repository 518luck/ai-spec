"use client";

// # TanStack Query 全局配置：取代 SWR，统一 useQuery/useMutation 默认行为

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { toast } from "@/features/toast";

// > queryKey 序列化为 toast id：同一请求重试期间只保持一条提示，成功后 dismiss（平移 SwrProvider 行为）
const toastIdOf = (queryKey: unknown): string => `query-error:${JSON.stringify(queryKey)}`;

// 全局 QueryClient 工厂：重试 3 次（对齐原 SWR errorRetryCount），失焦不重拉
const useCreateQueryClient = () =>
	useState(() => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: 3,
					refetchOnWindowFocus: false,
					staleTime: 0,
				},
				mutations: {
					retry: 0,
				},
			},
			queryCache: new QueryCache({
				onError: (error, query) => {
					// 读请求失败：按 queryKey 去重 toast，重试期间只更新同一条
					toast.error(
						error instanceof Error && error.message ? error.message : "请求失败，请稍后重试",
						{ id: toastIdOf(query.queryKey) },
					);
				},
				onSuccess: (_data, query) => {
					// 重试成功后关闭对应的错误提示
					toast.dismiss(toastIdOf(query.queryKey));
				},
			}),
			mutationCache: new MutationCache({
				onError: (error) => {
					// 写请求失败：mutation 不像 query 那样自动重试，失败即提示
					toast.error(
						error instanceof Error && error.message ? error.message : "操作失败，请稍后重试",
					);
				},
			}),
		});
		return queryClient;
	});

// > Provider：包裹应用，注入全局 QueryClient
export function QueryProvider({ children }: { children: ReactNode }) {
	const [queryClient] = useCreateQueryClient();
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
