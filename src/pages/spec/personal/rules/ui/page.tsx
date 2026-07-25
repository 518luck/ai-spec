"use client";

// # 个人规约库页：规则列表表格，对齐 keys 页表格范式

import type { JSX } from "react";
import { Button } from "@/shared/ui/button";
import { Kbd } from "@/shared/ui/kbd";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { RuleTable } from "./table";

export function PersonalRulesPage(): JSX.Element {
	return (
		<ToolbarPageShell
			title="规约库"
			actions={
				<Button size="sm" variant="outline" className="gap-2">
					新增规约
					<Kbd alignWithText hideOnNarrow>
						C
					</Kbd>
				</Button>
			}
		>
			<PageWidthWrapper fill>
				<RuleTable />
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
