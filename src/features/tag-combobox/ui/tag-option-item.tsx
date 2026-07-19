// # 标签列表项：文字被截断时才显示 Tooltip（hover 看全名），没截断不显示

import { type JSX, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";
import type { TagOptionVo } from "@/shared/lib/zod/schemas/tag";
import { CommandItem } from "@/shared/ui/command";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

export function TagOptionItem({
	tag,
	selected,
	onSelect,
}: {
	tag: TagOptionVo;
	selected: boolean;
	onSelect: () => void;
}): JSX.Element {
	const labelRef = useRef<HTMLSpanElement>(null);
	const [truncated, setTruncated] = useState(false);

	// hover 时检测文字是否溢出：scrollWidth > clientWidth 说明被 truncate 了
	const handleMouseEnter = (): void => {
		const el = labelRef.current;
		if (el) setTruncated(el.scrollWidth > el.clientWidth);
	};

	const content = (
		<>
			<span
				className="size-2 shrink-0 rounded-full"
				style={{ backgroundColor: tag.color }}
				aria-hidden
			/>
			<span ref={labelRef} className="min-w-0 flex-1 truncate">
				{tag.name}
			</span>
			<Icons.check className={cn("ml-auto size-4", selected ? "opacity-100" : "opacity-0")} />
		</>
	);

	const itemClassName =
		"cursor-pointer bg-transparent! hover:bg-accent! hover:text-accent-foreground!";

	if (!truncated) {
		return (
			<CommandItem
				value={tag.name}
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
						value={tag.name}
						onSelect={onSelect}
						onMouseEnter={handleMouseEnter}
						className={itemClassName}
					/>
				}
			>
				{content}
			</TooltipTrigger>
			<TooltipContent showArrow={false} side="right" align="center">
				{tag.name}
			</TooltipContent>
		</Tooltip>
	);
}
