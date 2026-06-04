import { DualSidebar, DualSidebarLayout } from "@/widgets/dual-sidebar";
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
      <DualSidebarLayout
        defaultSidebarOpen={false}
        sidebar={
          <DualSidebar
            businessNav={<div>业务图标栏</div>}
            operationNav={<div>操作菜单栏</div>}
          />
        }
      >
        {children}
      </DualSidebarLayout>
    </KBar>
  );
}
