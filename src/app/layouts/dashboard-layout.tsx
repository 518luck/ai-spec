// # 仪表盘布局：套上 KBar 命令面板与 Tooltip Provider，再放双栏侧边布局

import { TooltipProvider } from "@/shared/ui/tooltip";
import { DualSidebarLayout } from "@/widgets/dual-sidebar";
import { KBar } from "../providers/KBar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<KBar>
			<TooltipProvider delay={30}>
				<DualSidebarLayout>{children}</DualSidebarLayout>
			</TooltipProvider>
		</KBar>
	);
}
