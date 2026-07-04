// 集中维护双栏布局各视觉分区的外壳与表面背景

// 外壳通用背景
const shell = "bg-foreground/[0.06]";

export const dualSidebarZoneClasses = {
	layout: {
		// 整体布局外壳
		shell: `${shell} text-foreground`,
	},
	businessNav: {
		// 左侧业务导航外壳
		shell,
	},
	operationNav: {
		// 右侧操作导航表面
		surface: "bg-background/50 text-foreground",
		shell,
	},
	content: {
		// 主内容区表面
		surface: "bg-background text-foreground",
		shell,
	},
} as const;
