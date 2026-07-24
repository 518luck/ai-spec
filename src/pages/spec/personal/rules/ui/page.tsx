"use client";

// # 个人规约库页：占位页面，后续实现规约库功能

import type { JSX } from "react";
import { Icons } from "@/shared/ui/icons";
import { EmptyState } from "@/widgets/empty-state";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";

// # 个人规约库页：SWR Infinite 拉取规约列表，底部哨兵进入视口时自动加载下一页
export function PersonalRulesPage(): JSX.Element {
	return (
		<ToolbarPageShell title="规约库">
			<PageWidthWrapper fill>
				<EmptyState icon={Icons.rulesLibrary} description="规约库功能即将上线，敬请期待" />
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
