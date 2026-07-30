"use client";

// # 截断文本 Tooltip：仅当文字被 truncate 溢出时，hover 才弹出完整内容

import type { JSX } from "react";
import { useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type TruncatedTooltipProps = {
	// 展示与 tooltip 共用的完整文案
	text: string;
	// 触发器额外 class（如 font-medium、text-muted-foreground）
	className?: string;
	// 气泡方位，默认 top
	side?: "top" | "bottom" | "left" | "right";
};

// 截断文本：未溢出只显示文字；溢出后 hover 用 Tooltip 看全文
export function TruncatedTooltip({
	text,
	className,
	side = "top",
}: TruncatedTooltipProps): JSX.Element {
	const textRef = useRef<HTMLSpanElement>(null);
	const [truncated, setTruncated] = useState(false);

	// hover 时检测是否溢出：scrollWidth > clientWidth 说明被截断了
	const handleMouseEnter = (): void => {
		const el = textRef.current;
		if (el) setTruncated(el.scrollWidth > el.clientWidth);
	};

	const label = (
		<span ref={textRef} className={cn("block min-w-0 truncate", className)}>
			{text}
		</span>
	);

	// 未截断：不挂 Tooltip，避免无意义气泡
	if (!truncated) {
		return (
			<span className="block min-w-0" onMouseEnter={handleMouseEnter}>
				{label}
			</span>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger
				delay={200}
				render={<span className="block min-w-0" onMouseEnter={handleMouseEnter} />}
			>
				{label}
			</TooltipTrigger>
			<TooltipContent showArrow={false} side={side} className="max-w-sm break-all">
				{text}
			</TooltipContent>
		</Tooltip>
	);
}
