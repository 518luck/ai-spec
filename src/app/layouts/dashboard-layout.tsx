import { TooltipProvider } from "@/shared/ui/tooltip";
import { DualSidebarLayout } from "@/widgets/dual-sidebar";
import { KBar } from "../providers/KBar";
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <KBar>
      {/* <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <PageContainer>{children}</PageContainer>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider> */}
      <TooltipProvider>
        <DualSidebarLayout defaultSidebarOpen={false}>
          {children}
        </DualSidebarLayout>
      </TooltipProvider>
    </KBar>
  );
}
