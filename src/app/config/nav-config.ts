import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Command,
  FolderKanban,
  SquareTerminal,
} from "lucide-react";

export type DashboardRole = "guest" | "member" | "editor" | "admin";

export type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  description?: string;
  badge?: string;
  disabled?: boolean;
  external?: boolean;
  items?: NavItem[];
  auth?: {
    roles?: DashboardRole[];
    featureFlag?: string;
  };
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const dashboardNavConfig: NavSection[] = [
  {
    title: "Discover",
    items: [
      {
        title: "Learn",
        url: "/learn",
        icon: BookOpen,
        description: "学习与参考内容",
        auth: {
          roles: ["guest", "member", "editor", "admin"],
        },
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      {
        title: "Workspace",
        url: "/workspace",
        icon: FolderKanban,
        description: "工作区与协作内容",
        auth: {
          roles: ["member", "editor", "admin"],
        },
      },
      {
        title: "Prompts",
        url: "/prompts",
        icon: Command,
        description: "提示词管理",
        auth: {
          roles: ["member", "editor", "admin"],
        },
      },
      {
        title: "Playground",
        url: "/playground",
        icon: SquareTerminal,
        description: "实验和交互测试",
        auth: {
          roles: ["editor", "admin"],
          featureFlag: "playground",
        },
      },
    ],
  },
];
