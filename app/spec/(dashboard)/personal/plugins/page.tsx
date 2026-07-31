import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";

// # 个人 Plugins 页占位（等待后续业务内容接入）
export default function Page() {
	return (
		<ToolbarPageShell title="Plugins">
			<PageWidthWrapper fill>
				<p className="text-muted-foreground">Plugins 个人管理页，待实现。</p>
			</PageWidthWrapper>
		</ToolbarPageShell>
	);
}
