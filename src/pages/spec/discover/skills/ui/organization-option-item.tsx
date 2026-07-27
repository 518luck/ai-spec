"use client";

// # 组织列表项：头像 + 名称 + skill 数量 + 勾选；名称截断时才显示 Tooltip

import { type JSX, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";
import type { OrganizationListItemVo } from "@/shared/lib/zod/schemas/discover-skill";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { CommandItem } from "@/shared/ui/command";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type OrganizationOptionItemProps = {
	org: OrganizationListItemVo;
	selected: boolean;
	onSelect: () => void;
};

// > 组织选项：文字被截断时才显示 Tooltip，没截断不显示
export function OrganizationOptionItem({
	org,
	selected,
	onSelect,
}: OrganizationOptionItemProps): JSX.Element {
	const labelRef = useRef<HTMLSpanElement>(null);
	const [truncated, setTruncated] = useState(false);

	// hover 时检测文字是否溢出：scrollWidth > clientWidth 说明被 truncate 了
	const handleMouseEnter = (): void => {
		const el = labelRef.current;
		if (el) setTruncated(el.scrollWidth > el.clientWidth);
	};

	const content = (
		<>
			{/* 不用 size="sm"：其 data 样式固定 24px，会盖过 className；列表项用 16px 更协调 */}
			<Avatar className="size-4 after:hidden">
				<AvatarImage src={org.authorAvatarUrl ?? undefined} alt={org.authorName} />
				<AvatarFallback className="text-[9px] leading-none">
					{org.authorName.slice(0, 1).toUpperCase() || "?"}
				</AvatarFallback>
			</Avatar>
			<span ref={labelRef} className="min-w-0 flex-1 truncate">
				{org.authorName}
			</span>
			<span className="shrink-0 text-muted-foreground text-xs tabular-nums">{org.skillCount}</span>
			<Icons.check className={cn("ml-auto size-4", selected ? "opacity-100" : "opacity-0")} />
		</>
	);

	const itemClassName =
		"cursor-pointer gap-2 bg-transparent! hover:bg-accent! hover:text-accent-foreground!";

	if (!truncated) {
		return (
			<CommandItem
				value={org.authorName}
				onSelect={onSelect}
				onMouseEnter={handleMouseEnter}
				className={itemClassName}
			>
				{content}
			</CommandItem>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<CommandItem
						value={org.authorName}
						onSelect={onSelect}
						onMouseEnter={handleMouseEnter}
						className={itemClassName}
					/>
				}
			>
				{content}
			</TooltipTrigger>
			<TooltipContent showArrow={false} side="right" align="center">
				{org.authorName}
			</TooltipContent>
		</Tooltip>
	);
}
