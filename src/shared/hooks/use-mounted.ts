import { useSyncExternalStore } from "react";

// # useMounted：判断组件是否已在客户端挂载
// > 基于 useSyncExternalStore 实现，SSR 时始终返回 false、客户端挂载后返回 true

// 空订阅函数，mounted 状态不需要监听外部变化
const emptySubscribe = () => () => {};

export const useMounted = (): boolean =>
	useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);
