import type { LucideIcon } from "lucide-react";
import { BookOpen, Command, FolderKanban, SquareTerminal } from "lucide-react";

export type DashboardRole = "guest" | "member" | "editor" | "admin";

export type NavItem = {
  title: string; // 导航显示名称
  url: string; // 内部路由或外部链接地址
  icon?: LucideIcon; // 导航图标
  description?: string; // 导航辅助说明
  badge?: string; // 导航角标文案
  disabled?: boolean; // 是否禁用当前导航项
  external?: boolean; // 是否跳转到外部链接
  items?: NavItem[]; // 子级导航项
  auth?: {
    roles?: DashboardRole[]; // 可访问当前导航项的角色
  };
};

export const dashboardNavConfig: NavItem[] = [
  {
    title: "Prompts",
    url: "/spec/prompts",
    icon: Command,
    description: "提示词管理",
    auth: {
      roles: ["member", "editor", "admin"],
    },
  },
  {
    title: "Workspace",
    url: "/spec/workspace",
    icon: FolderKanban,
    description: "工作区与协作内容",
    auth: {
      roles: ["member", "editor", "admin"],
    },
  },

  {
    title: "Playground",
    url: "/spec/playground",
    icon: SquareTerminal,
    description: "实验和交互测试",
    auth: {
      roles: ["editor", "admin"],
    },
  },
  {
    title: "Learn",
    url: "/spec/learn",
    icon: BookOpen,
    description: "学习与参考内容",
    auth: {
      roles: ["guest", "member", "editor", "admin"],
    },
  },
];
