"use client";

// # 组织筛选 chip：头像 + 名称 + 可选删除按钮（带 x）

import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type OrganizationChipProps = {
	// 组织展示名（GitHub login）
	name: string;
	// 头像 URL；缺省 / 加载失败时走 AvatarFallback
	avatarUrl?: string | null;
	// 是否可删除（筛选场景可删）
	removable?: boolean;
	// 点击删除按钮的回调
	onRemove?: () => void;
	// 只显示头像模式：chip 收缩为单个头像，hover 显示名称 Tooltip；此模式下强制不渲染删除按钮
	iconOnly?: boolean;
	className?: string;
};

// chip 内嵌头像：不用 size="sm"（其 data 样式固定 24px，会顶满 h-6 的 chip）
function OrganizationAvatar({
	name,
	avatarUrl,
	className,
}: {
	name: string;
	avatarUrl?: string | null;
	className?: string;
}): JSX.Element {
	return (
		<Avatar
			className={cn(
				// size-3.5=14px，明显小于 h-6 chip；after:hidden 去掉外圈描边避免视觉放大
				"size-3.5 after:hidden",
				className,
			)}
		>
			<AvatarImage src={avatarUrl ?? undefined} alt={name} />
			<AvatarFallback className="text-[9px] leading-none">
				{name.slice(0, 1).toUpperCase() || "?"}
			</AvatarFallback>
		</Avatar>
	);
}

// > 组织 chip：头像 + 名称截断 + 可选 x；iconOnly 模式收缩为单头像 + Tooltip
export function OrganizationChip({
	name,
	avatarUrl,
	removable = false,
	onRemove,
	iconOnly = false,
	className,
}: OrganizationChipProps): JSX.Element {
	// > iconOnly 模式：只渲染头像，名称走 Tooltip；移除按钮在这种模式下没意义，强制隐藏
	if (iconOnly) {
		return (
			<Tooltip>
				<TooltipTrigger
					render={
						<span
							className={cn(
								"inline-flex size-5 shrink-0 cursor-default items-center justify-center rounded-full bg-secondary",
								className,
							)}
						/>
					}
				>
					<OrganizationAvatar name={name} avatarUrl={avatarUrl} />
				</TooltipTrigger>
				<TooltipContent showArrow={false}>{name}</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<span
			className={cn(
				"inline-flex h-6 shrink-0 cursor-default select-none items-center gap-1.5 rounded-full bg-secondary px-2 font-medium text-secondary-foreground text-xs",
				className,
			)}
		>
			<OrganizationAvatar name={name} avatarUrl={avatarUrl} />
			<span className="max-w-28 select-none truncate">{name}</span>
			{removable && (
				<button
					type="button"
					className="ml-0.5 flex shrink-0 items-center rounded-full hover:bg-foreground/10"
					onClick={onRemove}
					aria-label={`移除组织 ${name}`}
				>
					<Icons.x className="size-3" />
				</button>
			)}
		</span>
	);
}
