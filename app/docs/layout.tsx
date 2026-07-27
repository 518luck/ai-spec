import { DocsSiteLayout } from "@/pages/docs";

// # 文档站布局(薄层路由,委托 DocsSiteLayout)
export default function Layout({ children }: { children: React.ReactNode }) {
	return <DocsSiteLayout>{children}</DocsSiteLayout>;
}
