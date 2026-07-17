"use client";

// # 搜索筛选弹层：右侧筛选按钮 + DropdownMenu，渲染外部指定的内置字段（多选开关）

import { Fragment, type JSX, useState } from "react";
import type { SearchFilters } from "@/shared/lib/search-filter";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";
import { SEARCH_FIELDS } from "../config/search-filters";
import type { SearchFieldKey } from "../model/types";
import { useSearchUrl } from "../model/use-search-url";

type SearchFilterPopoverProps = {
	// 外部指定显示哪些字段（从内置全集 SEARCH_FIELDS 里取）
	filters: SearchFieldKey[];
	// URL 无 filter 参数时的回退默认值
	defaultFilters: SearchFilters;
};

// > 字段多选开关：点击切换该字段的 true/false，写入 filter JSON；选中项用整行背景高亮（无对勾）
export function SearchFilterPopover({
	filters,
	defaultFilters,
}: SearchFilterPopoverProps): JSX.Element {
	const { getFilters, setFilters } = useSearchUrl(defaultFilters);
	const [open, setOpen] = useState(false);

	// 解析出要渲染的字段配置；按外部传入顺序渲染
	const visibleFields = filters.map((key) => SEARCH_FIELDS[key]);
	// 当前 filter 状态
	const currentFilters = getFilters();

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="筛选"
						className={cn("shrink-0", open && "bg-accent text-accent-foreground")}
					>
						<Icons.chevronDown className="size-4" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-24 min-w-24">
				{visibleFields.map((field, index) => {
					// 读取该字段是否激活（true=参与搜索）
					const selected = currentFilters[field.key] === true;
					// > 当前激活字段数：用于"至少保留一个"约束 —— 取消最后一个选中项时拒绝操作，避免产生空 filter（后端无兜底）
					const activeCount = visibleFields.filter((f) => currentFilters[f.key] === true).length;
					// 该项是否被锁定（选中 + 是最后一个激活项 → 禁止取消）
					const isLocked = selected && activeCount === 1;
					return (
						<Fragment key={field.key}>
							<DropdownMenuItem
								// > 多选场景：点一个不关闭菜单，让用户继续选其他字段
								closeOnClick={false}
								disabled={isLocked}
								onClick={() => {
									// 锁定态兜底（键盘/辅助技术可能绕过 disabled 触发）
									if (isLocked) return;
									// 切换该字段：true→undefined，其他→true（布尔开关）
									setFilters({
										...currentFilters,
										[field.key]: selected ? undefined : true,
									});
								}}
								className="cursor-pointer px-2 data-disabled:cursor-not-allowed data-disabled:opacity-50"
							>
								{field.text}
								{/* 选中时显示对勾（右侧），未选时占位保持文字位置稳定（避免选中/取消时左右跳动） */}
								<Icons.check
									className={cn("ml-auto size-4 shrink-0", selected ? "opacity-100" : "opacity-0")}
								/>
							</DropdownMenuItem>
							{/* 分隔线：每个 item 下方一条，最后一个不画 */}
							{index < visibleFields.length - 1 ? <DropdownMenuSeparator className="mx-2" /> : null}
						</Fragment>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
