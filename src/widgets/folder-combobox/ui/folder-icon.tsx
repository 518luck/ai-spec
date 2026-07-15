// # 文件夹图标：带圆角方块背景，用 color 的淡彩底（15% 不透明度）+ 同色图标

import type { CSSProperties, JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { type Icon, Icons } from "@/shared/ui/icons";

type FolderIconProps = {
	// 文件夹颜色值（#RRGGBB），驱动方块底色与图标色
	color: string;
	// 自定义图标，默认是闭合文件夹
	icon?: Icon;
	// 外层方块容器的样式（尺寸、圆角等），默认 size-7 rounded-md
	className?: string;
	// 内部图标的样式（尺寸等），默认 size-4
	iconClassName?: string;
};

// 带圆角方块背景的文件夹图标：color 的淡彩底（15% 不透明度）+ 同色图标
export function FolderIcon({
	color,
	icon,
	className,
	iconClassName,
}: FolderIconProps): JSX.Element {
	const Glyph = icon ?? Icons.folderClosed;
	// 淡彩底直接设在 span 上；图标颜色直接设在 svg 上，避免 currentColor 继承被干扰
	const spanStyle: CSSProperties = {
		backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
	};
	const iconStyle: CSSProperties = { color };
	return (
		<span
			style={spanStyle}
			className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", className)}
		>
			<Glyph style={iconStyle} className={cn("size-4", iconClassName)} />
		</span>
	);
}
