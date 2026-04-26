import { DashboardLayout } from "@/app/layouts/dashboard-layout";

export default function dashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
