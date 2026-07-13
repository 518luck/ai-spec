// # 文件夹图标：带圆角方块背景，有 color 时淡彩底 + 同色图标，无 color 时灰色底

import type { CSSProperties, JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { type Icon, Icons } from "@/shared/ui/icons";

type FolderIconProps = {
	// 文件夹颜色值（hex）；不传则显示中性灰底
	color?: string;
	// 自定义图标，默认是闭合文件夹；"未分类"项传 folderX 区分语义
	icon?: Icon;
	// 外层方块容器的样式（尺寸、圆角等），默认 size-7 rounded-md
	className?: string;
	// 内部图标的样式（尺寸等），默认 size-4
	iconClassName?: string;
};

// 带圆角方块背景的文件夹图标：有 color 时用淡彩底（15% 不透明度）+ 同色图标，无 color 时用灰色底 + 默认图标
export function FolderIcon({
	color,
	icon,
	className,
	iconClassName,
}: FolderIconProps): JSX.Element {
	const Glyph = icon ?? Icons.folderClosed;
	// color 有值时：淡彩底直接设在 span 上；图标颜色直接设在 svg 上，避免 currentColor 继承被干扰
	const spanStyle: CSSProperties | undefined = color
		? { backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }
		: undefined;
	const iconStyle: CSSProperties | undefined = color ? { color } : undefined;
	return (
		<span
			style={spanStyle}
			className={cn(
				"flex size-7 shrink-0 items-center justify-center rounded-md",
				color ? "" : "bg-muted",
				className,
			)}
		>
			<Glyph
				style={iconStyle}
				className={cn("size-4", color ? "" : "text-foreground", iconClassName)}
			/>
		</span>
	);
}
