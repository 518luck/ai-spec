// # 空状态占位：列表为空或未登录时的图标 + 文案提示

import type { JSX } from "react";

import type { Icon } from "@/shared/ui/icons";

type EmptyStateProps = {
	/** 占位图标组件 */
	icon: Icon;
	/** 占位提示文案 */
	description: string;
};

export function EmptyState({ icon: Icon, description }: EmptyStateProps): JSX.Element {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
			<Icon className="size-8 opacity-40" />
			<p className="text-sm">{description}</p>
		</div>
	);
}
