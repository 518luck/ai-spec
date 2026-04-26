import { TooltipProvider } from "@/shared/ui/tooltip";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { AppSidebar } from "@/widgets/app-sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <div>顶部</div>
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
}
