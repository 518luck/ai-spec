"use client";

// # URL 读写 hook：封装 searchParams 读取 + router.replace 写入；专门处理 filter 参数的 JSON↔base64

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
	DEFAULT_FILTERS,
	decodeFilters,
	encodeFilters,
	SEARCH_FILTER_PARAM,
	type SearchFilters,
} from "../config/search-filters";

// > 通用 URL 参数读写 + filter 专用读写：set 时保留其他参数，delete 时移除指定参数；均不触发滚动
export const useSearchUrl = () => {
	const router = useRouter();
	const searchParams = useSearchParams();

	// 读取某个参数的当前值；不存在返回 undefined
	const getParam = useCallback(
		(name: string): string | undefined => searchParams?.get(name) ?? undefined,
		[searchParams],
	);

	// 写入参数（空串视为删除）；基于当前 searchParams 克隆后修改，保留其他参数
	const setParam = useCallback(
		(name: string, value: string) => {
			const params = new URLSearchParams(searchParams?.toString() ?? "");
			if (value) params.set(name, value);
			else params.delete(name);
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[searchParams, router],
	);

	// 删除参数
	const deleteParam = useCallback(
		(name: string) => {
			const params = new URLSearchParams(searchParams?.toString() ?? "");
			params.delete(name);
			router.replace(`?${params.toString()}`, { scroll: false });
		},
		[searchParams, router],
	);

	// > 读取 filter 状态：URL 无 filter 参数时回退默认值（只搜标题）
	const getFilters = useCallback((): SearchFilters => {
		const encoded = getParam(SEARCH_FILTER_PARAM);
		return decodeFilters(encoded) ?? DEFAULT_FILTERS;
	}, [getParam]);

	// > 写入 filter 状态：与默认值相等时不写 filter 参数（保持 URL 干净）；否则编码后写入
	const setFilters = useCallback(
		(filters: SearchFilters) => {
			// JSON 内容稳定比较：键值对序列化后字符串相等视为相等
			const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);
			if (isDefault) deleteParam(SEARCH_FILTER_PARAM);
			else setParam(SEARCH_FILTER_PARAM, encodeFilters(filters));
		},
		[deleteParam, setParam],
	);

	return { getParam, setParam, deleteParam, getFilters, setFilters };
};
