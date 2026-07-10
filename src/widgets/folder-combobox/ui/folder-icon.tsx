import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";

type FolderIconProps = {
	className?: string;
};

/**
 * 带圆角方块背景的文件夹图标。
 * 外层 bg-muted 方块 + 居中的 folderClosed 图标，用于文件夹相关的列表/选择器做视觉标识。
 */
export function FolderIcon({ className }: FolderIconProps): JSX.Element {
	return (
		<span
			className={cn(
				"flex size-7 shrink-0 items-center justify-center rounded-md bg-muted",
				className,
			)}
		>
			<Icons.folderClosed className="size-4 text-foreground" />
		</span>
	);
}
