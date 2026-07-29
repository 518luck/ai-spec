"use client";

// # 规约布局触发器：布局预设 PanelTrigger + 视图切换卡片

import type { JSX } from "react";

import { PanelTrigger } from "@/features/panel-trigger";
import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";

const VIEW_OPTIONS = [
	{ value: "table" as const, label: "表格", icon: Icons.viewTable },
	{ value: "grid" as const, label: "卡片", icon: Icons.viewGrid },
];

// 列表视图：表格（默认）或卡片网格
export type RuleView = "table" | "grid";

type RuleLayoutTriggerProps = {
	// 当前选中的视图
	value: RuleView;
	// 点击切换；写 URL 由调用方负责
	onChange: (next: RuleView) => void;
};

// > 布局壳：layout 预设 + 表格/卡片两块并排卡片
export function RuleLayoutTrigger({ value, onChange }: RuleLayoutTriggerProps): JSX.Element {
	return (
		<PanelTrigger
			variant="layout"
			menuClassName="w-auto"
			menu={
				<div className="flex gap-2 p-1">
					{VIEW_OPTIONS.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => onChange(option.value)}
							className={cn(
								"flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground",
								value === option.value && "bg-accent text-foreground",
							)}
						>
							<option.icon className="size-4" />
							<span className="text-xs">{option.label}</span>
						</button>
					))}
				</div>
			}
		/>
	);
}
