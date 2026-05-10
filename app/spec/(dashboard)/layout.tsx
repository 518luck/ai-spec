import { DashboardLayout as DashboardLayoutImp } from "@/app/layouts/dashboard-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutImp>{children}</DashboardLayoutImp>;
}
