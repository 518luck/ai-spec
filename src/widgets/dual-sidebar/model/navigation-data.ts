import type { Icon } from "@/shared/ui/icons";
import { Icons } from "@/shared/ui/icons";

// 左侧业务导航栏单个导航项配置。
export type NavBusinessItem = {
  name: string;
  description: string;
  icon: Icon;
  href: string;
  active: boolean;
  learnMoreHref?: string;
};

// 根据当前路由上下文生成左侧业务导航项列表。
export type NavBusinessDataFn = (data: {
  slug?: string;
  pathname: string;
}) => NavBusinessItem[];

// 生成左侧业务导航栏的空间入口数据，便于统一遍历渲染。
export const getNavBusinessItems: NavBusinessDataFn = ({ pathname }) => [
  {
    name: "个人空间",
    description: "管理个人 Prompt、规约和 AI 配置。",
    icon: Icons.user,
    href: "/spec/personal",
    active: pathname === "/spec/personal",
  },
  {
    name: "团队空间",
    description: "团队协作、项目管理和共享资产。",
    icon: Icons.brandTeams,
    href: "/spec/team",
    active: pathname === "/spec/team",
  },
  {
    name: "发现",
    description: "探索公共资产、热门 Prompt 和社区规约。",
    icon: Icons.compass,
    href: "/spec/discover",
    active: pathname === "/spec/discover",
  },
];
