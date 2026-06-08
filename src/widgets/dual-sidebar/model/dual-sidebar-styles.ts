// 集中维护双栏布局各视觉分区的外壳与表面背景。
export const dualSidebarZoneClasses = {
  layout: {
    shell: "bg-background text-foreground", // 整体布局外壳背景和默认文字颜色。
  },
  businessNav: {
    shell: "bg-background", // 左侧业务导航栏背景。
  },
  operationNav: {
    shell: "bg-black", // 右侧操作导航栏外层背景。
    surface: "bg-sidebar text-sidebar-foreground", // 右侧操作导航栏圆角面板背景和文字颜色。
  },
  content: {
    shell: "bg-background", // 主内容区外层背景。
    surface: "bg-purple-200", // 主内容区圆角内容面板背景。
  },
} as const;
