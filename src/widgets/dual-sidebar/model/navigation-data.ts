import type { Icon } from "@/shared/ui/icons";
import { Icons } from "@/shared/ui/icons";

// 导航数据生成函数共享的路由上下文。
export type NavBusinessData = {
  slug?: string;
  pathname: string;
};

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

// 根据当前路由上下文生成左侧业务导航项列表。
export type NavBusinessDataFn<T extends Record<PropertyKey, unknown>> = (
  data: T,
) => NavBusinessItem[];

// 定义左侧业务导航对应的右侧资源区域键。
export type NavArea = "personal" | "team" | "discover";

// 右侧资源导航栏单个叶子菜单项配置。
export type NavResourceItem = {
  name: string;
  description?: string;
  href: string;
  active: boolean;
  // 是否将菜单项展示为锁定状态。
  locked?: boolean;
};

// 右侧资源导航栏的二级菜单项配置。
export type NavSubItemType = NavResourceItem;

// 右侧资源导航栏的一级菜单项配置，可承载图标和二级菜单。
export type NavItemType = NavResourceItem & {
  icon: Icon;
  items?: NavSubItemType[];
};

// 右侧资源导航栏单个区域的完整分组配置。
export type SidebarNavGroup = {
  title: string;
  direction?: "left" | "right";
  content: {
    name?: string;
    items: NavItemType[];
  }[];
};

// 按区域组织右侧导航分组生成函数，所有分组共享同一份上下文参数。
export type SidebarNavGroups<
  T extends Record<PropertyKey, unknown>,
  TArea extends string,
> = Record<TArea, (args: T) => SidebarNavGroup>;

// 根据当前路径判断右侧资源导航栏应该展示的区域。
export const getCurrentNavArea = ({
  pathname,
}: NavBusinessData): NavArea | null => {
  if (pathname.startsWith("/spec/personal")) {
    return "personal";
  }

  if (pathname.startsWith("/spec/team")) {
    return "team";
  }

  if (pathname.startsWith("/spec/discover")) {
    return "discover";
  }

  return null;
};

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

// 生成右侧资源导航栏的分组数据。
export const sidebarNavGroups: SidebarNavGroups<NavBusinessData, NavArea> = {
  personal: ({ pathname }) => ({
    title: "个人空间",
    direction: "right",
    content: [
      {
        items: [
          {
            name: "Prompt",
            icon: Icons.personal,
            href: "/spec/personal/prompts",
            active: pathname === "/spec/personal/prompts",
          },
          {
            name: "规约库",
            icon: Icons.discover,
            href: "/spec/personal/rules",
            active: pathname === "/spec/personal/rules",
          },
          {
            name: "设置",
            icon: Icons.palette,
            href: "/spec/personal/settings",
            active: pathname === "/spec/personal/settings",
          },
        ],
      },
      {
        name: "AI 规约",
        items: [
          {
            name: "AGENTS.md",
            icon: Icons.logo,
            href: "/spec/personal/ai-spec/agents-md",
            active: pathname === "/spec/personal/ai-spec/agents-md",
          },
          {
            name: "Skills",
            icon: Icons.logo,
            href: "/spec/personal/ai-spec/skills",
            active: pathname === "/spec/personal/ai-spec/skills",
          },
          {
            name: "Agents",
            icon: Icons.team,
            href: "/spec/personal/ai-spec/agents",
            active: pathname === "/spec/personal/ai-spec/agents",
          },
          {
            name: "Plugins",
            description: "管理 AI 工具插件和扩展能力。",
            icon: Icons.gift,
            href: "/spec/personal/ai-spec/plugins",
            active: pathname === "/spec/personal/ai-spec/plugins",
          },
        ],
      },
    ],
  }),
  team: ({ pathname }) => ({
    title: "工作空间",
    direction: "right",
    content: [
      {
        items: [
          {
            name: "项目",
            icon: Icons.team,
            href: "/spec/team/projects",
            active: pathname === "/spec/team/projects",
          },
          {
            name: "成员",
            icon: Icons.personal,
            href: "/spec/team/members",
            active: pathname === "/spec/team/members",
          },
        ],
      },
      {
        name: "共享资产",
        items: [
          {
            name: "AGENTS.md",
            icon: Icons.logo,
            href: "/spec/team/shared-assets/agents-md",
            active: pathname === "/spec/team/shared-assets/agents-md",
          },
          {
            name: "Skills",
            icon: Icons.logo,
            href: "/spec/team/shared-assets/skills",
            active: pathname === "/spec/team/shared-assets/skills",
          },
          {
            name: "Agents",
            icon: Icons.team,
            href: "/spec/team/shared-assets/agents",
            active: pathname === "/spec/team/shared-assets/agents",
          },
          {
            name: "Plugins",
            description: "管理团队共享的 AI 工具插件和扩展能力。",
            icon: Icons.gift,
            href: "/spec/team/shared-assets/plugins",
            active: pathname === "/spec/team/shared-assets/plugins",
          },
        ],
      },
    ],
  }),
  discover: ({ pathname }) => ({
    title: "发现",
    direction: "right",
    content: [
      {
        items: [
          {
            name: "Prompt",
            icon: Icons.discover,
            href: "/spec/discover/prompts",
            active: pathname === "/spec/discover/prompts",
          },
          {
            name: "AGENTS.md",
            icon: Icons.logo,
            href: "/spec/discover/ai-spec/agents-md",
            active: pathname === "/spec/discover/ai-spec/agents-md",
          },
          {
            name: "Skills",
            icon: Icons.logo,
            href: "/spec/discover/ai-spec/skills",
            active: pathname === "/spec/discover/ai-spec/skills",
          },
          {
            name: "Agents",
            icon: Icons.team,
            href: "/spec/discover/ai-spec/agents",
            active: pathname === "/spec/discover/ai-spec/agents",
          },
          {
            name: "Plugins",
            description: "发现社区共享的 AI 工具插件和扩展能力。",
            icon: Icons.gift,
            href: "/spec/discover/ai-spec/plugins",
            active: pathname === "/spec/discover/ai-spec/plugins",
          },
        ],
      },
    ],
  }),
};
