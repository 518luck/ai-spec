// 集中维护双栏布局各视觉分区的外壳与表面背景。
export const dualSidebarZoneClasses = {
  layout: {
    shell: "bg-muted text-foreground", // 整体布局外壳使用弱化背景和默认文字颜色。
  },
  businessNav: {
    shell: "bg-muted", // 左侧业务导航栏使用正常背景。
  },
  operationNav: {
    shell: "bg-muted", // 右侧操作导航栏外壳使用弱化背景。
    surface: "bg-background/50 text-foreground", // 右侧操作导航栏表面使用半透明正常背景。
  },
  content: {
    shell: "bg-muted", // 主内容区外壳使用弱化背景。
    surface: "bg-background text-foreground", // 主内容区表面使用正常背景。
  },
} as const;
