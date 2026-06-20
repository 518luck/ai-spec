import { TooltipProvider } from "@/shared/ui/tooltip";
import { DualSidebarLayout } from "@/widgets/dual-sidebar";
import { KBar } from "../providers/KBar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <KBar>
      <TooltipProvider>
        <DualSidebarLayout>{children}</DualSidebarLayout>
      </TooltipProvider>
    </KBar>
  );
}
