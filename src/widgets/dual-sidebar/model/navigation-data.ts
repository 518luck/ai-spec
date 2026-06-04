import type { Icon } from "@/shared/ui/icons";
import { IconCompass, IconUser, IconUsers } from "@tabler/icons-react";

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

// 个人空间导航数据。
export const getPersonalNavItems: NavBusinessDataFn = ({ pathname }) => [
  {
    name: "个人空间",
    description: "管理个人 Prompt、规约和 AI 配置。",
    icon: IconUser,
    href: "/personal",
    active: pathname === "/personal",
  },
];

// 团队空间导航数据。
export const getTeamNavItems: NavBusinessDataFn = ({ pathname }) => [
  {
    name: "团队空间",
    description: "团队协作、项目管理和共享资产。",
    icon: IconUsers,
    href: "/team",
    active: pathname === "/team",
  },
];

// 发现导航数据。
export const getDiscoverNavItems: NavBusinessDataFn = ({ pathname }) => [
  {
    name: "发现",
    description: "探索公共资产、热门 Prompt 和社区规约。",
    icon: IconCompass,
    href: "/discover",
    active: pathname === "/discover",
  },
];
