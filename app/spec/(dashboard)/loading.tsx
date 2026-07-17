// # Dashboard 路由加载态：首次进入或切换 dashboard 下路由时，主内容区显示加载动画（侧边栏常驻）

import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";

// 填满 DualSidebarContent 主内容区，侧边栏保持不变
export default function DashboardLoading() {
	return (
		<div className="flex min-h-0 flex-1 items-center justify-center text-muted-foreground">
			<ScaleLoaderWrap />
		</div>
	);
}
