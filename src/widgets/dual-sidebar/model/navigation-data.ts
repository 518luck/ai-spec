import type { Icon } from "@/shared/ui/icons";
import { Icons } from "@/shared/ui/icons";

// 定义业务导航图标悬停时可选的动画效果。
export type NavIconAnimation = "none" | "rotate" | "shake";

// 左侧业务导航栏单个导航项配置。
export type NavBusinessItem = {
  name: string;
  description: string;
  icon: Icon;
  iconAnimation?: NavIconAnimation;
  href: string;
  active: boolean;
  learnMoreHref?: string;
};

// 左侧业务导航生成函数的路由上下文。
export type NavBusinessData = {
  slug?: string;
  pathname: string;
};

// 根据当前路由上下文生成左侧业务导航项列表。
export type NavBusinessDataFn<T extends Record<PropertyKey, unknown>> = (
  data: T,
) => NavBusinessItem[];

// 生成左侧业务导航栏的空间入口数据，便于统一遍历渲染。
export const getNavBusinessItems: NavBusinessDataFn<NavBusinessData> = ({
  pathname,
}) => [
  {
    name: "个人空间",
    description: "管理个人 Prompt、规约和 AI 配置。",
    icon: Icons.personal,
    iconAnimation: "rotate",
    href: "/spec/personal",
    active: pathname === "/spec/personal",
    learnMoreHref: "#",
  },
  {
    name: "团队空间",
    description: "团队协作、项目管理和共享资产。",
    icon: Icons.team,
    iconAnimation: "shake",
    href: "/spec/team",
    active: pathname === "/spec/team",
    learnMoreHref: "#",
  },
  {
    name: "发现",
    description: "探索公共资产、热门 Prompt 和社区规约。",
    icon: Icons.discover,
    iconAnimation: "rotate",
    href: "/spec/discover",
    active: pathname === "/spec/discover",
    learnMoreHref: "#",
  },
];
