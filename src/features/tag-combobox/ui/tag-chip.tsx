"use client";

// # 标签 chip：颜色点 + 名称 + 可选删除按钮（带 x）

import type { CSSProperties, JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";

type TagChipProps = {
	// 标签名称
	name: string;
	// 标签颜色（#RRGGBB），驱动色点与底色
	color: string;
	// 是否可删除（编辑/筛选场景可删，只读模式不渲染 x）
	removable?: boolean;
	// 点击删除按钮的回调
	onRemove?: () => void;
	className?: string;
};

// > 标签 chip：淡彩底 + 同色点 + 名称 + 可选删除按钮
export function TagChip({
	name,
	color,
	removable = false,
	onRemove,
	className,
}: TagChipProps): JSX.Element {
	const style: CSSProperties = {
		backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
		color: `color-mix(in srgb, ${color} 75%, text)`,
	};

	return (
		<span
			style={style}
			className={cn(
				"inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 font-medium text-xs",
				className,
			)}
		>
			<span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
			<span className="max-w-24 truncate">{name}</span>
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
