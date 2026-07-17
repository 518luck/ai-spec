"use client";

// # 搜索输入框：左侧搜索图标 + 输入框（防抖写 URL）+ 有内容时显示清空按钮

import { type JSX, useState } from "react";
import { useDebounce } from "@/shared/hooks";
import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";
import {
	SEARCH_DEBOUNCE_MS,
	SEARCH_PLACEHOLDER,
	SEARCH_QUERY_PARAM,
} from "../config/search-filters";
import { useSearchUrl } from "../model/use-search-url";

type SearchInputFieldProps = {
	// 容器 className
	className?: string;
};

// > 输入即触发防抖：value 作为 deps，每次变化重设定时器；停止输入后写 URL，避免逐字请求
export function SearchInputField({ className }: SearchInputFieldProps): JSX.Element {
	// 搜索词写入的 URL 参数名固定为 q（对齐 Linear）
	const param = SEARCH_QUERY_PARAM;
	const { getParam, setParam, deleteParam } = useSearchUrl();
	// 初始值来自 URL，支持刷新/分享链接回填
	const [value, setValue] = useState(() => getParam(param) ?? "");

	// 防抖写 URL：value 每次变化重设定时器，停止输入后执行 fn
	useDebounce(
		() => {
			const trimmed = value.trim();
			if (trimmed) setParam(param, trimmed);
			else if (getParam(param)) deleteParam(param);
		},
		SEARCH_DEBOUNCE_MS,
		[value],
	);

	// 清空：立即清空输入并同步删除 URL 参数（即时响应，不等防抖）
	const handleClear = (): void => {
		setValue("");
		deleteParam(param);
	};

	return (
		<div className={cn("flex flex-1 items-center gap-2", className)}>
			<input
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder={SEARCH_PLACEHOLDER}
				className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			/>
			{value ? (
				<button
					type="button"
					aria-label="清空搜索"
					onClick={handleClear}
					className="flex shrink-0 cursor-pointer items-center text-muted-foreground transition-colors hover:text-foreground"
				>
					<Icons.x className="size-4" />
				</button>
			) : null}
		</div>
	);
}
