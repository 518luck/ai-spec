"use client";

// # 收录筛选：在通用 PanelTrigger 上组装「标签 + 收藏 + 常用」
// > chips/触发器/Popover 全部由 TagSelectTrigger 内聚，本组件只负责收录业务菜单项
// > 「收藏」是布尔筛选：开启后写 URL ?favorite=true 并清掉 folderId，跨文件夹返回当前用户收藏的收录

import { useRouter, useSearchParams } from "next/navigation";
import { type JSX, useCallback, useState } from "react";

import { PanelTrigger } from "@/features/panel-trigger";
import { TagCombobox, TagSelectTrigger } from "@/features/tag-combobox";
import { cn } from "@/shared/lib/utils";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import {
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/shared/ui/dropdown-menu";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";

type RecordFilterProps = {
	// 已选标签：透传给内嵌的 TagSelectTrigger（不传则走 URL ?tagIds=）
	value?: TagOptionVo[];
	// 选中变化回调：透传给内嵌的 TagSelectTrigger
	onChange?: (tags: TagOptionVo[]) => void;
	// 外层容器 className（控制最大宽度等）
	className?: string;
};

// > 收录页筛选：过滤壳 + 标签子菜单 + 收藏/常用开关 + 右侧标签 chips
export function RecordFilter({ value, onChange, className }: RecordFilterProps): JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();
	// TagSelectTrigger 受控 open：用户也可直接点 + 按钮单独打开标签面板
	const [tagOpen, setTagOpen] = useState(false);

	// 当前是否处于收藏视图（URL ?favorite=true）
	const favoriteActive = searchParams?.get("favorite") === "true";
	// 当前是否处于「常用」排序（URL ?sort=mostCopied）
	const mostCopiedActive = searchParams?.get("sort") === "mostCopied";

	// 切换收藏筛选：开启时写 favorite=true 并清掉 folderId 和 sort（互斥），关闭时仅删 favorite
	const handleToggleFavorite = useCallback((): void => {
		const params = new URLSearchParams(searchParams?.toString() ?? "");
		if (favoriteActive) {
			params.delete("favorite");
		} else {
			params.set("favorite", "true");
			params.delete("folderId");
			params.delete("sort");
		}
		router.replace(`?${params.toString()}`, { scroll: false });
	}, [favoriteActive, searchParams, router]);

	// 切换「常用」排序：开启时写 sort=mostCopied，关闭时仅删 sort；不影响 folderId/favorite，后端支持组合筛选
	const handleToggleMostCopied = useCallback((): void => {
		const params = new URLSearchParams(searchParams?.toString() ?? "");
		if (mostCopiedActive) {
			params.delete("sort");
		} else {
			params.set("sort", "mostCopied");
		}
		router.replace(`?${params.toString()}`, { scroll: false });
	}, [mostCopiedActive, searchParams, router]);

	return (
		<PanelTrigger
			className={className}
			menu={
				<>
					{/* // 标签子菜单：hover/点击在右侧展开标签面板，类型菜单保持可见 */}
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2">
							<Icons.tag className="size-4 text-foreground" />
							标签
						</DropdownMenuSubTrigger>
						{/* // overflow-hidden：盖掉 SubContent 默认 overflow-y-auto，滚动只发生在 CommandList，底部弥散遮罩才能生效 */}
						<DropdownMenuSubContent className="overflow-hidden p-0">
							<TagCombobox resourceType="promptRecord" value={value} onChange={onChange} />
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
					{/* // 常用切换：按 HN 幂律热度公式排序，持续使用的 prompt 靠前、长期未用的下沉 */}
					<DropdownMenuItem
						closeOnClick={false}
						onClick={handleToggleMostCopied}
						className="mt-1 cursor-pointer gap-2"
					>
						<Icons.trending className="size-4 text-foreground" />
						<span>常用</span>
						{/* // 帮助气泡：解释"常用"的排序原理，hover 显示，不会触发菜单项点击 */}
						<HelpTooltip content="按近期热度排序：复制越多越靠前，长期没用会自然下沉。" />
						<Icons.check
							className={cn(
								"ml-auto size-4 shrink-0",
								mostCopiedActive ? "opacity-100" : "opacity-0",
							)}
						/>
					</DropdownMenuItem>
				</>
			}
			trailing={
				// 右侧标签选择器：未选时不展示；选中后展示 chips；受控 open 用于类型菜单联动
				<TagSelectTrigger
					resourceType="promptRecord"
					value={value}
					onChange={onChange}
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
