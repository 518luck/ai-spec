import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

type UseLocalStorageReturn<TValue> = [TValue, Dispatch<SetStateAction<TValue>>];

// 解析本地存储中的字符串值，字符串类型保持原值兼容。
const deserializeLocalStorageValue = <TValue>(value: string): TValue => {
  try {
    return JSON.parse(value) as TValue;
  } catch {
    return value as TValue;
  }
};

// 序列化本地存储值，字符串类型直接保存。
const serializeLocalStorageValue = <TValue>(value: TValue): string => {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
};

// 从 localStorage 中读取指定 key 的值。
const readLocalStorageValue = <TValue>(
  key: string,
  initialValue: TValue,
): TValue => {
  if (typeof window === "undefined") {
    return initialValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);

    return storedValue === null
      ? initialValue
      : deserializeLocalStorageValue(storedValue);
  } catch {
    return initialValue;
  }
};

// 像 useState 一样读写 localStorage，并用 state 触发界面刷新。
export const useLocalStorage = <TValue>(
  key: string,
  initialValue: TValue,
): UseLocalStorageReturn<TValue> => {
  const [storedValue, setStoredValue] = useState<TValue>(() =>
    readLocalStorageValue(key, initialValue),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(key, serializeLocalStorageValue(storedValue));
    } catch {}
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};
