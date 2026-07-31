import { type Dispatch, type SetStateAction, useCallback, useSyncExternalStore } from "react";

type UseLocalStorageReturn<TValue> = [TValue, Dispatch<SetStateAction<TValue>>];

// 解析 localStorage 值，字符串保持原值兼容（用户手写的纯文本），其余 JSON.parse
const deserialize = <TValue>(value: string): TValue => {
	try {
		return JSON.parse(value) as TValue;
	} catch {
		return value as TValue;
	}
};

// 序列化：字符串直接存，其余 JSON.stringify
const serialize = <TValue>(value: TValue): string =>
	typeof value === "string" ? value : JSON.stringify(value);

// 按 key 缓存当前值，保证 getSnapshot 返回稳定引用，避免 React 无限重渲染
const cache = new Map<string, unknown>();
// 按 key 维护订阅者集合，setter 写入后通知本 tab 订阅者刷新
const subscribers = new Map<string, Set<() => void>>();

// 从 localStorage 读取并反序列化，读失败回落 initialValue
const readFromStorage = <TValue>(key: string, initialValue: TValue): TValue => {
	try {
		const stored = window.localStorage.getItem(key);
		return stored === null ? initialValue : deserialize<TValue>(stored);
	} catch {
		return initialValue;
	}
};

// 写入 localStorage、更新缓存并通知本 key 的所有订阅者
const writeToStorage = <TValue>(key: string, value: TValue): void => {
	cache.set(key, value);
	try {
		window.localStorage.setItem(key, serialize(value));
	} catch {}
	const listeners = subscribers.get(key);
	if (listeners) {
		for (const cb of listeners) {
			cb();
		}
	}
};

// 类型守卫：区分 SetStateAction 的函数式与值式分支，正确窄化泛型（typeof === "function" 无法排除 TValue & Function）
const isStateUpdater = <TValue>(
	next: SetStateAction<TValue>,
): next is (prevState: TValue) => TValue => typeof next === "function";

// # useLocalStorage：像 useState 一样读写 localStorage，setter 支持函数式更新（无 stale closure）
// > 基于 useSyncExternalStore 实现：SSR 与客户端首帧均返回 initialValue，挂载后切到 localStorage 值，彻底避免 hydration 不匹配
// > 跨 tab 通过 storage 事件同步；本 tab 写入立即通知订阅者
// > ! 不用 react-use 的 useLocalStorage：它有 stale closure bug（issue #2512，函数式更新拿到旧值）
export const useLocalStorage = <TValue>(
	key: string,
	initialValue: TValue,
): UseLocalStorageReturn<TValue> => {
	// 订阅 store 变化：登记回调、监听跨 tab storage 事件，卸载时清理
	const subscribe = useCallback(
		(onStoreChange: () => void): (() => void) => {
			let listeners = subscribers.get(key);
			if (!listeners) {
				listeners = new Set();
				subscribers.set(key, listeners);
			}
			listeners.add(onStoreChange);

			// 跨 tab 同步：失效缓存后通知本 key 订阅者重读
			const onStorage = (event: StorageEvent): void => {
				if (event.key !== key) return;
				cache.delete(key);
				onStoreChange();
			};
			window.addEventListener("storage", onStorage);

			return () => {
				const current = subscribers.get(key);
				if (current) {
					current.delete(onStoreChange);
				}
				window.removeEventListener("storage", onStorage);
			};
		},
		[key],
	);

	// 客户端快照：命中缓存直接返回，否则读 localStorage 并回填缓存
	const getSnapshot = useCallback((): TValue => {
		if (cache.has(key)) {
			return cache.get(key) as TValue;
		}
		const value = readFromStorage(key, initialValue);
		cache.set(key, value);
		return value;
	}, [key, initialValue]);

	// 服务端快照：永远返回 initialValue，与客户端首帧一致
	const getServerSnapshot = useCallback((): TValue => initialValue, [initialValue]);

	const storedValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	// setter：支持函数式更新，写入后由 writeToStorage 通知订阅者触发重渲染
	const setValue = useCallback(
		(next: SetStateAction<TValue>): void => {
			const prev = cache.has(key) ? (cache.get(key) as TValue) : readFromStorage(key, initialValue);
			const value = isStateUpdater(next) ? next(prev) : next;
			writeToStorage(key, value);
		},
		[key, initialValue],
	);

	return [storedValue, setValue];
};
