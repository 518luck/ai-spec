"use client";

// # 通用筛选菜单壳：可选预设（过滤/布局）+ 菜单槽位 + 右侧已选条件槽位
// > 壳子只负责视觉与开合；具体筛选项（标签/组织/收藏…）和 chips 由调用方传入

import { type JSX, type ReactNode, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { Icons } from "@/shared/ui/icons";

// @ 预设配置：variant → 图标 + 文本
const FILTER_SHELL_PRESETS = {
	filter: { icon: <Icons.filter2 className="size-4" />, label: "过滤" },
	layout: { icon: <Icons.layout className="size-4" />, label: "布局" },
} as const;

type FilterShellVariant = keyof typeof FILTER_SHELL_PRESETS;

type FilterShellProps = {
	// 预设变体，默认 "filter"
	variant?: FilterShellVariant;
	// 类型菜单内容：由调用方组合 SubMenu / 开关项等
	menu: ReactNode;
	// 右侧已选条件展示（chips 等）；未选时可传 null/undefined 不占位
	trailing?: ReactNode;
	// 菜单容器 className：用于按菜单内容调整宽度或间距
	menuClassName?: string;
	// 外层容器 className（控制最大宽度等）
	className?: string;
};

// > 通用筛选壳：根据 variant 渲染对应图标与文本，菜单与 chips 完全外置
export function FilterShell({
	variant = "filter",
	menu,
	trailing,
	menuClassName,
	className,
}: FilterShellProps): JSX.Element {
	// 菜单 open：驱动触发按钮箭头翻转
	const [menuOpen, setMenuOpen] = useState(false);
	const { icon, label } = FILTER_SHELL_PRESETS[variant];

	return (
		<div className={cn("flex min-w-0 items-center gap-2", className)}>
			{/* // 触发按钮：预设图标 + 文本 + 下箭头，菜单展开时箭头翻转 */}
			<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
				<DropdownMenuTrigger
					render={
						<Button
							variant="outline"
							size="sm"
							className="h-9 shrink-0 gap-1 text-muted-foreground"
						>
							{icon}
							{label}
							<Icons.chevronDown
								className="size-4 transition-transform duration-200"
								style={{ transform: menuOpen ? "rotate(180deg)" : undefined }}
							/>
						</Button>
					}
				/>
				<DropdownMenuContent align="start" className={cn("w-30", menuClassName)}>
					{menu}
				</DropdownMenuContent>
			</DropdownMenu>

			{trailing}
		</div>
	);
}
