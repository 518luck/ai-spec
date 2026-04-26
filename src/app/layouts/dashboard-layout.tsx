import { TooltipProvider } from "@/shared/ui/tooltip";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { AppSidebar } from "@/widgets/app-sidebar";
import { AppHeader } from "@/widgets/app-header";
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <AppHeader />
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
}
