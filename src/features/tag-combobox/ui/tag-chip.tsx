"use client";

// # 标签 chip：颜色点 + 名称 + 可选删除按钮（带 x）；iconOnly 模式只显示圆点，hover 出 Tooltip

import type { CSSProperties, JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type TagChipProps = {
	// 标签名称
	name: string;
	// 标签颜色（#RRGGBB），驱动色点与底色
	color: string;
	// 是否可删除（编辑/筛选场景可删，只读模式不渲染 x）
	removable?: boolean;
	// 点击删除按钮的回调
	onRemove?: () => void;
	// 只显示圆点模式：chip 收缩为单个色点，hover 显示名称 Tooltip；此模式下强制不渲染删除按钮
	iconOnly?: boolean;
	className?: string;
};

// > 标签 chip：淡彩底 + 同色点 + 名称 + 可选删除按钮；iconOnly 模式收缩为单点 + Tooltip
export function TagChip({
	name,
	color,
	removable = false,
	onRemove,
	iconOnly = false,
	className,
}: TagChipProps): JSX.Element {
	const style: CSSProperties = {
		backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
		color: `color-mix(in srgb, ${color} 75%, text)`,
	};

	// > iconOnly 模式：只渲染色点，名称走 Tooltip；移除按钮在这种模式下没意义（hover 文字才是主要交互），强制隐藏
	if (iconOnly) {
		return (
			<Tooltip>
				<TooltipTrigger
					render={
						<span
							style={style}
							className={cn(
								"inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded-full",
								className,
							)}
						/>
					}
				>
					<span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
				</TooltipTrigger>
				<TooltipContent showArrow={false}>{name}</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<span
			style={style}
			className={cn(
				"inline-flex h-6 shrink-0 cursor-default select-none items-center gap-1 rounded-full px-2 font-medium text-xs",
				className,
			)}
		>
			{/* <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden /> */}
			<span className="max-w-24 select-none truncate">{name}</span>
			{removable && (
				<button
					type="button"
					className="ml-0.5 flex shrink-0 items-center rounded-full hover:bg-foreground/10"
					onClick={onRemove}
					aria-label={`移除标签 ${name}`}
				>
					<Icons.x className="size-3" />
				</button>
			)}
		</span>
	);
}
