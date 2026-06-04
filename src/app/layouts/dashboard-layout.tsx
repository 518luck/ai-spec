import { KBar } from "../providers/KBar";
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <KBar>
      你好
      {/* <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <PageContainer>{children}</PageContainer>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider> */}
    </KBar>
  );
}
