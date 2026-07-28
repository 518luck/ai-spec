"use client";

// # 规约布局触发器：布局预设 PanelTrigger + 视图切换菜单项

import type { JSX } from "react";

import { PanelTrigger } from "@/features/panel-trigger";
import { cn } from "@/shared/lib/utils";
import { DropdownMenuItem } from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";
import type { RuleView } from "./view-toggle";

const VIEW_OPTIONS = [
	{ value: "table" as const, label: "表格", icon: Icons.viewTable },
	{ value: "grid" as const, label: "卡片", icon: Icons.viewGrid },
];

type RuleLayoutTriggerProps = {
	// 当前选中的视图
	value: RuleView;
	// 点击切换；写 URL 由调用方负责
	onChange: (next: RuleView) => void;
};

// > 布局壳：layout 预设 + 表格/卡片视图切换菜单项
export function RuleLayoutTrigger({ value, onChange }: RuleLayoutTriggerProps): JSX.Element {
	return (
		<PanelTrigger
			variant="layout"
			menu={VIEW_OPTIONS.map((option) => (
				<DropdownMenuItem
					key={option.value}
					onClick={() => onChange(option.value)}
					className="gap-2"
				>
					<option.icon className="size-4" />
					<span>{option.label}</span>
					<Icons.check
						className={cn(
							"ml-auto size-4 shrink-0",
							value === option.value ? "opacity-100" : "opacity-0",
						)}
					/>
				</DropdownMenuItem>
			))}
		/>
	);
}
