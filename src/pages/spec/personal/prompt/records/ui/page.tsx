import type { JSX } from "react";

import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";

// # 个人收录页占位（等待后续业务内容接入）
export function PersonalRecordsPage(): JSX.Element {
	return (
		<ToolbarPageShell title="收录">
			<PageWidthWrapper fill>
				<div>收录</div>
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
