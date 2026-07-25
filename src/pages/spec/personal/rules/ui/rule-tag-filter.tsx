"use client";

// # 规约标签过滤器：「过滤」按钮（内嵌标签子菜单）+ 右侧已选标签条
// > 视觉与收录页 FilterCombobox 一致，但只含标签维度（规约暂无收藏/常用排序能力）

import { type JSX, useState } from "react";
import { TagCombobox } from "@/features/tag-combobox";
import { TagSelectTrigger } from "@/features/tag-combobox/ui/tag-select-trigger";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";

type RuleTagFilterProps = {
	className?: string;
};

// > 过滤按钮 + 标签子菜单 + 右侧已选标签条；TagSelectTrigger 在 URL 模式下读写 ?tagIds=
export function RuleTagFilter({ className }: RuleTagFilterProps): JSX.Element {
	// TagSelectTrigger 受控 open：用户也可直接点 + 按钮单独打开标签面板
	const [tagOpen, setTagOpen] = useState(false);
	// 类型菜单 open：驱动触发按钮箭头翻转
	const [typeOpen, setTypeOpen] = useState(false);

	return (
		<div className={cn("flex items-center gap-2", className)}>
			{/* // 「过滤」按钮：filter 图标 + 文本 + 下箭头，点击开类型菜单；菜单展开时箭头翻转向上 */}
			<DropdownMenu open={typeOpen} onOpenChange={setTypeOpen}>
				<DropdownMenuTrigger
					render={
						<Button
							variant="outline"
							size="sm"
							className="h-9 shrink-0 gap-1 text-muted-foreground"
						>
							<Icons.filter2 className="size-4" />
							过滤
							<Icons.chevronDown
								className="size-4 transition-transform duration-200"
								style={{ transform: typeOpen ? "rotate(180deg)" : undefined }}
							/>
						</Button>
					}
				/>
				<DropdownMenuContent align="start" className="w-30">
					{/* // 标签子菜单：hover/点击在右侧展开标签面板，类型菜单保持可见 */}
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2">
							<Icons.tag className="size-4 text-foreground" />
							标签
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="p-0">
							<TagCombobox resourceType="rules" />
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* // 右侧已选标签条：未选时不展示（顶部「过滤 → 标签」入口兜底）；选中后展示 chips + 触发器；受控 open 用于类型菜单联动 */}
			<TagSelectTrigger
				resourceType="rules"
				open={tagOpen}
				onOpenChange={setTagOpen}
				hideWhenEmpty
				showAddButton={false}
				className="max-w-md"
			/>
		</div>
	);
}
