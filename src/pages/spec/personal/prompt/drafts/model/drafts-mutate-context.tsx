"use client";

// # 草稿列表重拉上下文 —— 把 useSWRInfinite 返回的 mutate 向下提供，绕开 SWR 全局 matcher 对 infinite key 不生效的缺陷

import { createContext, type JSX, type ReactNode, useContext } from "react";

// useSWRInfinite 返回的 mutate：无参调用 = 重拉所有已挂载页
export type DraftsMutate = () => Promise<unknown>;

const DraftsMutateContext = createContext<DraftsMutate | null>(null);

// > Provider：由持有 useSWRInfinite 实例的页面组件注入其 mutate
export function DraftsMutateProvider({
	mutate,
	children,
}: {
	mutate: DraftsMutate;
	children: ReactNode;
}): JSX.Element {
	return <DraftsMutateContext value={mutate}>{children}</DraftsMutateContext>;
}

// 消费草稿列表 mutate；未在 Provider 内调用直接抛错，避免静默不刷新
export const useDraftsMutate = (): DraftsMutate => {
	const mutate = useContext(DraftsMutateContext);
	if (!mutate) {
		throw new Error("useDraftsMutate 必须在 DraftsMutateProvider 内调用");
	}
	return mutate;
};
