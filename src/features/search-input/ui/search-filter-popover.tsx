"use client";

// # 搜索筛选弹层：右侧筛选按钮 + Popover 弹层，渲染外部指定的内置字段（多选开关）

import { type JSX, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/shared/ui/command";
import { Icons } from "@/shared/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { SEARCH_FIELDS } from "../config/search-filters";
import type { SearchFieldKey } from "../model/types";
import { useSearchUrl } from "../model/use-search-url";

type SearchFilterPopoverProps = {
	// 外部指定显示哪些字段（从内置全集 SEARCH_FIELDS 里取）
	filters: SearchFieldKey[];
};

// > 字段多选开关：点击切换该字段的 true/false，写入 filter JSON；有任一字段非默认值时按钮高亮
export function SearchFilterPopover({ filters }: SearchFilterPopoverProps): JSX.Element {
	const { getFilters, setFilters } = useSearchUrl();
	const [open, setOpen] = useState(false);

	// 解析出要渲染的字段配置；按外部传入顺序渲染
	const visibleFields = filters.map((key) => SEARCH_FIELDS[key]);
	// 当前 filter 状态
	const currentFilters = getFilters();

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="筛选"
						className={cn("shrink-0", open && "bg-accent text-accent-foreground")}
					>
						<Icons.filter className="size-4" />
					</Button>
				}
			/>
			<PopoverContent className="w-40 p-0" align="end">
				<Command>
					<CommandList>
						<CommandGroup>
							{visibleFields.map((field) => {
								// 读取该字段是否激活（true=参与搜索）
								const selected = currentFilters[field.key] === true;
								return (
									<CommandItem
										key={field.key}
										value={field.text}
										onSelect={() => {
											// 切换该字段：true→undefined，其他→true（布尔开关）
											setFilters({
												...currentFilters,
												[field.key]: selected ? undefined : true,
											});
										}}
										// > 选中态：整行背景高亮
										data-selected={selected || undefined}
										className="cursor-pointer data-selected:bg-accent data-selected:text-accent-foreground"
									>
										{field.text}
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
