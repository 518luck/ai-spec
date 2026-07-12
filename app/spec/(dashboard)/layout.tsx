import { DashboardLayout as DashboardLayoutImp } from "@/app/layouts/dashboard-layout";

// # 仪表盘布局（薄层路由，委托 DashboardLayout 组件）
export default function Layout({ children }: { children: React.ReactNode }) {
	return <DashboardLayoutImp>{children}</DashboardLayoutImp>;
}
