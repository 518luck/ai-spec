"use client";

// # 规约标签过滤器：通用 PanelTrigger + 仅「标签」一维
// > 规约暂无收藏/常用排序能力，菜单只挂标签子面板

import { type JSX, useState } from "react";

import { PanelTrigger } from "@/features/panel-trigger";
import { TagCombobox } from "@/features/tag-combobox";
import { TagSelectTrigger } from "@/features/tag-combobox/ui/tag-select-trigger";
import {
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";

type TagFilterProps = {
	className?: string;
};

// > 过滤壳 + 标签子菜单 + 右侧已选标签条；TagSelectTrigger 在 URL 模式下读写 ?tagIds=
export function TagFilter({ className }: TagFilterProps): JSX.Element {
	// TagSelectTrigger 受控 open：用户也可直接点 + 按钮单独打开标签面板
	const [tagOpen, setTagOpen] = useState(false);

	return (
		<PanelTrigger
			className={className}
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
			trailing={
				// 右侧已选标签条：未选时不展示；选中后展示 chips
				<TagSelectTrigger
					resourceType="rules"
					open={tagOpen}
					onOpenChange={setTagOpen}
					hideWhenEmpty
					showAddButton={false}
					className="max-w-md"
				/>
			}
		/>
	);
}
