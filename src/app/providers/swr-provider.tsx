"use client";

// # SWR 全局配置：统一所有 useSWR 的默认行为（错误 toast 去重、允许有限重试）

import type { ReactNode } from "react";
import { toast } from "sonner";
import { SWRConfig } from "swr";

// > 用 SWR key 序列化作为 toast id：同一请求重试期间只保持一个提示，不同请求互不干扰
const toastIdOf = (key: unknown): string => `swr-error:${JSON.stringify(key)}`;

// > 全局 SWR 默认配置：每个 useSWR 调用自动继承，组件层无需重复配置
export function SwrProvider({ children }: { children: ReactNode }) {
	return (
		<SWRConfig
			value={{
				// 失焦时不自动重拉，避免无谓请求
				revalidateOnFocus: false,
				// 失败自动重试，最多 3 次（SWR 默认无限重试，这里封顶避免无限打扰）
				errorRetryCount: 3,
				// 失败 toast 按 key 去重：同一请求重试期间反复失败只更新同一条提示，不堆叠
				onError: (err, key) =>
					toast.error(err instanceof Error && err.message ? err.message : "请求失败，请稍后重试", {
						id: toastIdOf(key),
					}),
				// 重试成功后自动关闭对应的错误提示
				onSuccess: (_data, key) => toast.dismiss(toastIdOf(key)),
			}}
		>
			{children}
		</SWRConfig>
	);
}
