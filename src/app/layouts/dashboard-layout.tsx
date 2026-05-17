import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { AppHeader } from "@/widgets/app-header";
import { AppSidebar } from "@/widgets/app-sidebar";
import { KBar } from "../providers/KBar";
import { PageContainer } from "./page-container";
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <KBar>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <PageContainer>{children}</PageContainer>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </KBar>
  );
}
