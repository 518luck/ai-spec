"use client";

// # 通用过滤壳：「过滤」按钮 + 类型菜单槽位 + 右侧已选条件槽位
// > 壳子只负责视觉与开合；具体筛选项（标签/组织/收藏…）和 chips 由调用方传入

import { type JSX, type ReactNode, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";

type FilterShellProps = {
	// 类型菜单内容：由调用方组合 SubMenu / 开关项等
	menu: ReactNode;
	// 右侧已选条件展示（chips 等）；未选时可传 null/undefined 不占位
	trailing?: ReactNode;
	// 外层容器 className（控制最大宽度等）
	className?: string;
};

// > 过滤按钮壳：统一按钮样式与箭头翻转，菜单与 chips 完全外置
export function FilterShell({ menu, trailing, className }: FilterShellProps): JSX.Element {
	// 类型菜单 open：驱动触发按钮箭头翻转
	const [typeOpen, setTypeOpen] = useState(false);

	return (
		<div className={cn("flex min-w-0 items-center gap-2", className)}>
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
					{menu}
				</DropdownMenuContent>
			</DropdownMenu>

			{trailing}
		</div>
	);
}
