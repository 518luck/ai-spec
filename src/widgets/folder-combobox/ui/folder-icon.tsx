import type { CSSProperties, JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";

type FolderIconProps = {
	// 文件夹颜色值（hex）；不传则显示中性灰底
	color?: string;
	className?: string;
};

// 带圆角方块背景的文件夹图标：有 color 时用淡彩底（15% 不透明度）+ 同色图标，无 color 时用灰色底 + 默认图标
export function FolderIcon({ color, className }: FolderIconProps): JSX.Element {
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
			<Icons.folderClosed
				style={iconStyle}
				className={cn("size-4", color ? "" : "text-foreground")}
			/>
		</span>
	);
}
