import type { JSX } from "react";

import { Icons } from "@/shared/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type HelpTooltipProps = {
	// hover 时展示的说明文案
	content: string;
};

// 帮助气泡：问号图标 hover 显示说明文案
export function HelpTooltip({ content }: HelpTooltipProps): JSX.Element {
	const Icon = Icons.helpSquareRounded;
	return (
		<Tooltip>
			<TooltipTrigger render={<Icon className="size-4 text-muted-foreground" />} />
			<TooltipContent>{content}</TooltipContent>
		</Tooltip>
	);
}
