"use client";

// # 收录列表重拉上下文 —— 把 useSWRInfinite 返回的 mutate 向下提供，绕开 SWR 全局 matcher 对 infinite key 不生效的缺陷

import { createContext, type JSX, type ReactNode, useContext } from "react";

// useSWRInfinite 返回的 mutate：无参调用 = 重拉所有已挂载页
export type Mutate = () => Promise<unknown>;

const MutateContext = createContext<Mutate | null>(null);

// > Provider：由持有 useSWRInfinite 实例的页面组件注入其 mutate
export function MutateProvider({
	mutate,
	children,
}: {
	mutate: Mutate;
	children: ReactNode;
}): JSX.Element {
	return <MutateContext value={mutate}>{children}</MutateContext>;
}

// 消费收录列表 mutate；未在 Provider 内调用直接抛错，避免静默不刷新
export const useMutate = (): Mutate => {
	const mutate = useContext(MutateContext);
	if (!mutate) {
		throw new Error("useMutate 必须在 MutateProvider 内调用");
	}
	return mutate;
};
