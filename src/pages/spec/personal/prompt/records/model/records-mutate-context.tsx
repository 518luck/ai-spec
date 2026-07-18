"use client";

// # 收录列表重拉上下文 —— 把 useSWRInfinite 返回的 mutate 向下提供，绕开 SWR 全局 matcher 对 infinite key 不生效的缺陷

import { createContext, type JSX, type ReactNode, useContext } from "react";

// useSWRInfinite 返回的 mutate：无参调用 = 重拉所有已挂载页
export type RecordsMutate = () => Promise<unknown>;

const RecordsMutateContext = createContext<RecordsMutate | null>(null);

// > Provider：由持有 useSWRInfinite 实例的页面组件注入其 mutate
export function RecordsMutateProvider({
	mutate,
	children,
}: {
	mutate: RecordsMutate;
	children: ReactNode;
}): JSX.Element {
	return <RecordsMutateContext value={mutate}>{children}</RecordsMutateContext>;
}

// 消费收录列表 mutate；未在 Provider 内调用直接抛错，避免静默不刷新
export const useRecordsMutate = (): RecordsMutate => {
	const mutate = useContext(RecordsMutateContext);
	if (!mutate) {
		throw new Error("useRecordsMutate 必须在 RecordsMutateProvider 内调用");
	}
	return mutate;
};
