import { useSyncExternalStore } from "react";

// 空订阅函数，mounted 状态不需要监听外部变化
const emptySubscribe = () => () => {};

// 判断组件是否已在客户端挂载，SSR 时始终返回 false
export const useMounted = (): boolean =>
	useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);
