"use client";

// # 搜索框主组件：一体化胶囊容器，左侧图标 + 中间输入框（防抖）+ 右侧可选筛选区

import { type JSX, useMemo } from "react";
import type { SearchFilters } from "@/shared/lib/search-filter";
import { cn } from "@/shared/lib/utils";
import { buildDefaultFilter } from "../config/search-filters";
import type { SearchInputProps } from "../model/types";
import { SearchFilterPopover } from "./search-filter-popover";
import { SearchInputField } from "./search-input-field";

// > 一体化胶囊：所有元素共享一个边框容器；不传 filters 时不渲染筛选按钮，退化为纯搜索框
export function SearchInput({ filters, defaultFilter, className }: SearchInputProps): JSX.Element {
	// 默认 filter 状态：由使用方通过 defaultFilter 指定（如草稿页传 "title"）；不传则为空对象
	const defaultFilters: SearchFilters = useMemo(
		() => (defaultFilter ? buildDefaultFilter(defaultFilter) : {}),
		[defaultFilter],
	);

	return (
		<div
			className={cn(
				// 胶囊容器：固定高度、圆角边框，聚焦时高亮边框；右侧 pr-1 让筛选按钮贴右，避免整体过宽
				// w-full 让宽度跟随父级，调用方用 max-w-* 约束上限，实现窄屏可收缩
				"flex h-9 w-full items-center gap-1 rounded-md border border-input bg-transparent pr-1 pl-2.5 transition-[color,box-shadow]",
				"focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
				"dark:bg-input/30",
				className,
			)}
		>
			<SearchInputField defaultFilters={defaultFilters} />
			{filters?.length ? (
				<>
					{/* 输入框与筛选区的分隔线 */}
					<div className="h-5 w-px shrink-0 bg-border" />
					<SearchFilterPopover filters={filters} defaultFilters={defaultFilters} />
					{/* // > 右侧 chip 区：预留给"已选标签/筛选条件"展示，做标签功能时在此渲染激活项；当前无内容先不占位，避免把筛选按钮挤离右边界 */}
				</>
			) : null}
		</div>
	);
}
