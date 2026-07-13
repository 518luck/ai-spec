import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

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

// 读 localStorage：SSR 返回 initialValue，读失败也返回 initialValue
const readValue = <TValue>(key: string, initialValue: TValue): TValue => {
	if (typeof window === "undefined") return initialValue;
	try {
		const stored = window.localStorage.getItem(key);
		return stored === null ? initialValue : deserialize<TValue>(stored);
	} catch {
		return initialValue;
	}
};

// # useLocalStorage：像 useState 一样读写 localStorage，setter 支持函数式更新（无 stale closure）
// > 基于 useState + useEffect 实现，返回 [TValue, setter]
// > SSR 时返回 initialValue，避免服务端/客户端不一致
// > ! 不用 react-use 的 useLocalStorage：它有 stale closure bug（issue #2512，函数式更新拿到旧值）
export const useLocalStorage = <TValue>(
	key: string,
	initialValue: TValue,
): UseLocalStorageReturn<TValue> => {
	const [storedValue, setStoredValue] = useState<TValue>(() => readValue(key, initialValue));

	// 写入 localStorage
	useEffect(() => {
		try {
			window.localStorage.setItem(key, serialize(storedValue));
		} catch {}
	}, [key, storedValue]);

	return [storedValue, setStoredValue];
};
