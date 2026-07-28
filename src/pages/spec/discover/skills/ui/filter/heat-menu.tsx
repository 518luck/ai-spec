"use client";

// # 热度档位面板：纯内容列表，不含 SubMenu/触发器
// > 由外层 SkillFilter 包在 DropdownMenuSubContent 内使用

import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { DropdownMenuItem } from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";
import { HEAT_THRESHOLDS } from "./heat-thresholds";

type HeatMenuProps = {
	// 当前选中的最低 star；undefined 表示未选
	value?: number;
	// 切换档位（点已选项应由外层决定清除或保持）
	onSelect: (minStars: number) => void;
};

// > 热度单选列表：star > 500 / 2k / 5k / 10k
export function HeatMenu({ value, onSelect }: HeatMenuProps): JSX.Element {
	return (
		<>
			{HEAT_THRESHOLDS.map((threshold) => {
				const active = value === threshold.value;
				return (
					<DropdownMenuItem
						key={threshold.value}
						closeOnClick={false}
						onClick={() => onSelect(threshold.value)}
						className="cursor-pointer gap-2"
					>
						<Icons.star className="size-4 shrink-0 text-muted-foreground" />
						<span className="flex-1 tabular-nums">{threshold.label}</span>
						<Icons.check
							className={cn("ml-auto size-4 shrink-0", active ? "opacity-100" : "opacity-0")}
						/>
					</DropdownMenuItem>
				);
			})}
		</>
	);
}
