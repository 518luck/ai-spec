// # 仪表盘布局：套上 KBar 命令面板与 Tooltip Provider，再放双栏侧边布局

import { TooltipProvider } from "@/shared/ui/tooltip";
import { SidebarLayout } from "@/widgets/dual-sidebar";
import { KBar } from "../providers/kbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<KBar>
			<TooltipProvider delay={30}>
				<SidebarLayout>{children}</SidebarLayout>
			</TooltipProvider>
		</KBar>
	);
}
