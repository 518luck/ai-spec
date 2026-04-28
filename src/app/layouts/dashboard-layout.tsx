import { TooltipProvider } from "@/shared/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/shared/ui/sidebar";
import { AppSidebar } from "@/widgets/app-sidebar";
import { AppHeader } from "@/widgets/app-header";
import { PageContainer } from "./page-container";
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <PageContainer>{children}</PageContainer>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
