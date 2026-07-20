"use client";

// # 筛选容器：「过滤」按钮打开类型菜单（标签 SubMenu 在右侧展开面板），右侧标签选择器
// > 类型菜单用 DropdownMenu + SubMenu：两个面板同时可见，避免 Popover 切换闪烁
// > chips/触发器/Popover 全部由 TagSelectTrigger 内聚，本组件只负责类型菜单 + 组装
// > 「收藏」是布尔筛选：开启后写 URL ?favorite=true 并清掉 folderId，跨文件夹返回当前用户收藏的收录

import { useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useState } from "react";
import { TagCombobox } from "@/features/tag-combobox";
import { TagSelectTrigger } from "@/features/tag-combobox/ui/tag-select-trigger";
import { cn } from "@/shared/lib/utils";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import { Button } from "@/shared/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";

type FilterComboboxProps = {
	// 标签归属的资源类型（如 "promptRecord"），透传给内嵌的 TagCombobox / TagSelectTrigger
	resourceType: string;
	// 已选标签：透传给内嵌的 TagSelectTrigger
	value?: TagOptionVo[];
	// 选中变化回调：透传给内嵌的 TagSelectTrigger
	onChange?: (tags: TagOptionVo[]) => void;
	// 外层容器 className（控制最大宽度等）
	className?: string;
};

// > 筛选容器：过滤按钮 + 类型菜单 + 标签选择器
export function FilterCombobox({
	resourceType,
	value,
	onChange,
	className,
}: FilterComboboxProps): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();
	// TagSelectTrigger 受控 open：用户也可直接点 + 按钮单独打开标签面板
	const [tagOpen, setTagOpen] = useState(false);
	// 类型菜单 open：驱动触发按钮箭头翻转
	const [typeOpen, setTypeOpen] = useState(false);

	// 当前是否处于收藏视图（URL ?favorite=true）
	const favoriteActive = searchParams?.get("favorite") === "true";

	// 切换收藏筛选：开启时写 favorite=true 并清掉 folderId（互斥），关闭时仅删 favorite
	const handleToggleFavorite = useCallback((): void => {
		const params = new URLSearchParams(searchParams?.toString() ?? "");
		if (favoriteActive) {
			params.delete("favorite");
		} else {
			params.set("favorite", "true");
			params.delete("folderId");
		}
		router.replace(`?${params.toString()}`, { scroll: false });
	}, [favoriteActive, searchParams, router]);

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
							<TagCombobox resourceType={resourceType} value={value} onChange={onChange} />
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					{/* // 收藏切换：点击 on/off 不关菜单，激活时显示对勾占位保持文字位置稳定 */}
					<DropdownMenuItem
						closeOnClick={false}
						onClick={handleToggleFavorite}
						className="mt-1 cursor-pointer gap-2"
					>
						<Icons.star className="size-4 text-foreground" />
						<span>收藏</span>
						<Icons.check
							className={cn(
								"ml-auto size-4 shrink-0",
								favoriteActive ? "opacity-100" : "opacity-0",
							)}
						/>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* // 右侧标签选择器：未选时不展示（顶部「过滤 → 标签」入口兜底）；选中后展示 chips + 触发器；受控 open 用于类型菜单联动 */}
			<TagSelectTrigger
				resourceType={resourceType}
				value={value}
				onChange={onChange}
				open={tagOpen}
				onOpenChange={setTagOpen}
				hideWhenEmpty
				showAddButton={false}
				className="max-w-md"
			/>
		</div>
	);
}
