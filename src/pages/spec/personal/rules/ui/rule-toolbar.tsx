"use client";

// # 规约工具栏：过滤按钮 + 视图切换 + 已选标签条，三者内聚在一行
// > chips 单独放布局触发器之后并 flex-1 横滚，避免撑宽推动其它触发器
// > tagOpen 联动过滤菜单的标签子面板与右侧 chips 条，状态内聚在此无需外传

import { type JSX, useState } from "react";

import { PanelTrigger } from "@/features/panel-trigger";
import { TagCombobox } from "@/features/tag-combobox";
import { TagSelectTrigger } from "@/features/tag-combobox/ui/tag-select-trigger";
import { cn } from "@/shared/lib/utils";
import {
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";

// 视图选项：表格（默认）与卡片网格
const VIEW_OPTIONS = [
	{ value: "table" as const, label: "表格", icon: Icons.viewTable },
	{ value: "grid" as const, label: "卡片", icon: Icons.viewGrid },
];

// 列表视图：表格（默认）或卡片网格
export type RuleView = "table" | "grid";

type RuleToolbarProps = {
	// 当前选中的视图
	value: RuleView;
	// 点击切换；写 URL 由调用方负责
	onViewChange: (next: RuleView) => void;
};

// > 工具栏：过滤菜单 + 布局切换 + 标签条，chips 吃掉剩余空间内部横滚
export function RuleToolbar({ value, onViewChange }: RuleToolbarProps): JSX.Element {
	// tagOpen 联动过滤菜单标签子面板与右侧 chips 条
	const [tagOpen, setTagOpen] = useState(false);

	return (
		<div className="flex min-w-0 flex-1 items-center gap-2">
			{/* // @ 过滤按钮：菜单只挂标签子面板（规约暂无收藏/常用排序能力） */}
			<PanelTrigger
				menu={
					// 标签子菜单：hover/点击在右侧展开标签面板，类型菜单保持可见
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2">
							<Icons.tag className="size-4 text-foreground" />
							标签
						</DropdownMenuSubTrigger>
						{/* // overflow-hidden：盖掉 SubContent 默认 overflow-y-auto，滚动只发生在 CommandList，底部弥散遮罩才能生效 */}
						<DropdownMenuSubContent className="overflow-hidden p-0">
							<TagCombobox resourceType="rules" />
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				}
			/>
			{/* // @ 布局触发器：表格/卡片切换，位置钉死不被 chips 推动 */}
			<PanelTrigger
				variant="layout"
				menuClassName="w-auto"
				menu={
					<div className="flex gap-2 p-1">
						{VIEW_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => onViewChange(option.value)}
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
			{/* // @ 已选标签条：吃掉剩余空间内部横滚，不撑宽推动左侧触发器；未选时不占位 */}
			<TagSelectTrigger
				resourceType="rules"
				open={tagOpen}
				onOpenChange={setTagOpen}
				hideWhenEmpty
				showAddButton={false}
				className="min-w-0 flex-1"
			/>
		</div>
	);
}
