// # 帮助气泡：问号图标 hover 显示说明文案，用于表单项或标题旁的辅助提示

import type { JSX } from "react";

import { cn } from "@/shared/lib/utils";
import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type HelpTooltipProps = {
	// hover 时展示的说明文案
	content: string;
	// 与同行文字视觉对齐：flex items-center 里 SVG 图标几何中心比文字 x-height 中心偏低，
	// 开启后图标上移 1px 补偿。仅用于「文字 + 等高图标」内联场景，独立图标不需要
	alignWithText?: boolean;
};

export function HelpTooltip({ content, alignWithText = false }: HelpTooltipProps): JSX.Element {
	const Icon = Icons.helpSquareRounded;
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Icon
						className={cn("size-4 text-muted-foreground", alignWithText && "-translate-y-px")}
					/>
				}
			/>
			<TooltipContent>{content}</TooltipContent>
		</Tooltip>
	);
}
