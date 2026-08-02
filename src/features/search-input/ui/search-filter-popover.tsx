"use client";

// # 搜索筛选弹层：右侧筛选按钮 + DropdownMenu，按字段 type 渲染：boolean=多选开关，single=范围单选区

import { Fragment, type JSX, useState } from "react";
import type { SearchFilters } from "@/shared/lib/search-filter-codec";
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
import { DEFAULT_SEARCH_SCOPE, SEARCH_FIELDS, SEARCH_SCOPES } from "../config/search-filters";
import type { SearchFieldKey, SearchScopeKey } from "../model/types";
import { useSearchUrl } from "../model/use-search-url";

type SearchFilterPopoverProps = {
	// 外部指定显示哪些字段（从内置全集 SEARCH_FIELDS 里取，可含特殊字段 "scope" 启用范围区）
	filters: SearchFieldKey[];
	// URL 无 filter 参数时的回退默认值
	defaultFilters: SearchFilters;
};

// 展平后的渲染项：boolean=字段开关（带锁定态），single=范围选项
type RenderItem =
	| {
			kind: "boolean";
			key: SearchFieldKey;
			text: string;
			selected: boolean;
			disabled: boolean;
			onClick: () => void;
	  }
	| {
			kind: "single";
			key: string;
			text: string;
			selected: boolean;
			onClick: () => void;
	  };

// > 字段多选开关：点击切换该字段的 true/false，写入 filter JSON；选中项用对勾标记（无整行高亮）
//   范围单选：scope 字段展开成 SEARCH_SCOPES 的选项列表，点击即切换（单选无 lock）
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
	// 当前激活的布尔字段数：用于"至少保留一个"约束（single 字段不参与计数）
	const activeCount = visibleFields.filter(
		(f) => f.type === "boolean" && currentFilters[f.key] === true,
	).length;

	// > 展平成统一的渲染项列表：single 字段展开为多个范围选项（带选中态），boolean 字段保持单项（带锁定态）
	const renderItems: RenderItem[] = [];
	for (const field of visibleFields) {
		if (field.type === "single") {
			for (const scopeKey of Object.keys(SEARCH_SCOPES) as SearchScopeKey[]) {
				renderItems.push({
					kind: "single",
					key: `scope:${scopeKey}`,
					text: SEARCH_SCOPES[scopeKey].text,
					// 选中态：URL 未指定 scope 时按缺省值（本项目）
					selected: (currentFilters.scope ?? DEFAULT_SEARCH_SCOPE) === scopeKey,
					onClick: () => setFilters({ ...currentFilters, scope: scopeKey }),
				});
			}
			continue;
		}
		const selected = currentFilters[field.key] === true;
		// 该项是否被锁定（选中 + 是最后一个激活项 → 禁止取消，避免产生空 filter）
		const isLocked = selected && activeCount === 1;
		renderItems.push({
			kind: "boolean",
			key: field.key,
			text: field.text,
			selected,
			disabled: isLocked,
			onClick: () => {
				// 锁定态兜底（键盘/辅助技术可能绕过 disabled 触发）
				if (isLocked) return;
				// 切换该字段：true→undefined，其他→true（布尔开关）
				setFilters({ ...currentFilters, [field.key]: selected ? undefined : true });
			},
		});
	}

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
						<Icons.chevronDown
							className="size-4 transition-transform duration-200"
							style={{ transform: open ? "rotate(180deg)" : undefined }}
						/>
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-28 min-w-28">
				{renderItems.map((item, index) => (
					<Fragment key={item.key}>
						{/* 分隔线：每个 item 上方一条，第一个不画 */}
						{index > 0 ? <DropdownMenuSeparator className="mx-2" /> : null}
						<DropdownMenuItem
							// 多选/单选均不关闭菜单，让用户继续调整其他选项
							closeOnClick={false}
							disabled={item.kind === "boolean" ? item.disabled : undefined}
							onClick={item.onClick}
							className="cursor-pointer px-2 data-disabled:cursor-not-allowed data-disabled:opacity-50"
						>
							{item.text}
							{/* 选中时显示对勾（右侧），未选时占位保持文字位置稳定（避免选中/取消时左右跳动） */}
							<Icons.check
								className={cn(
									"ml-auto size-4 shrink-0",
									item.selected ? "opacity-100" : "opacity-0",
								)}
							/>
						</DropdownMenuItem>
					</Fragment>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
