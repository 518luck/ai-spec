import type { Icon } from "@/shared/ui/icons";
import { Icons } from "@/shared/ui/icons";

// 导航数据生成函数共享的路由上下文。
export type NavContext = {
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
export type NavBusinessItemsFn<T extends Record<PropertyKey, unknown>> = (
  data: T,
) => NavBusinessItem[];

// 定义左侧业务导航对应的右侧资源区域键。
export type NavBusinessArea = "personal" | "team" | "discover" | "settings";

// 固定左侧业务区域顺序，供右侧面板切换动画稳定渲染。
export const navBusinessAreas: readonly NavBusinessArea[] = [
  "personal",
  "team",
  "discover",
  "settings",
];

// 定义左侧业务导航点击后应进入的右侧首个菜单项。
export const navBusinessAreaDefaultHrefs: Record<NavBusinessArea, string> = {
  personal: "/spec/personal",
  team: "/spec/team",
  discover: "/spec/discover",
  settings: "/spec/settings",
};

// 右侧区域导航栏单个叶子菜单项配置。
export type NavAreaItem = {
  name: string;
  description?: string;
  href: string;
  active: boolean;
  // 是否将菜单项展示为锁定状态。
  locked?: boolean;
};

// 右侧区域导航栏的二级菜单项配置。
export type NavAreaSubItem = NavAreaItem;

// 右侧区域导航栏的一级菜单项配置，可承载图标和二级菜单。
export type NavAreaMainItem = NavAreaItem & {
  icon: Icon;
  items?: NavAreaSubItem[];
};

// 右侧区域导航栏单个面板配置。
export type NavAreaPanel = {
  title: string;
  direction?: "left" | "right";
  content: {
    name?: string;
    items: NavAreaMainItem[];
  }[];
};

// 按业务区域组织右侧导航面板生成函数，所有面板共享同一份上下文参数。
export type NavAreaPanels<
  T extends Record<PropertyKey, unknown>,
  TArea extends string,
> = Record<TArea, (args: T) => NavAreaPanel>;

// TODO : 后面可以根据工作空间来分布设置
// 根据当前路径判断左侧业务导航当前所在区域。
export const getCurrentNavBusinessArea = ({
  pathname,
}: NavContext): NavBusinessArea | null => {
  if (pathname.startsWith("/spec/personal")) {
    return "personal";
  }

  if (pathname.startsWith("/spec/team")) {
    return "team";
  }

  if (pathname.startsWith("/spec/discover")) {
    return "discover";
  }

  if (pathname.startsWith("/spec/settings")) {
    return "settings";
  }

  return null;
};

// 生成左侧业务导航栏的空间入口数据，便于统一遍历渲染。
export const getNavBusinessItems: NavBusinessItemsFn<NavContext> = ({
  pathname,
}) => {
  const currentBusinessArea = getCurrentNavBusinessArea({ pathname });

  return [
    {
      name: "个人空间",
      description: "管理个人 Prompt、规约和 AI 配置。",
      icon: Icons.personal,
      iconAnimation: "rotate",
      href: navBusinessAreaDefaultHrefs.personal,
      active: currentBusinessArea === "personal",
      learnMoreHref: "#",
    },
    {
      name: "团队空间",
      description: "团队协作、项目管理和共享资产。",
      icon: Icons.team,
      iconAnimation: "shake",
      href: navBusinessAreaDefaultHrefs.team,
      active: currentBusinessArea === "team",
      learnMoreHref: "#",
    },
    {
      name: "发现",
      description: "探索公共资产、热门 Prompt 和社区规约。",
      icon: Icons.discover,
      iconAnimation: "rotate",
      href: navBusinessAreaDefaultHrefs.discover,
      active: currentBusinessArea === "discover",
      learnMoreHref: "#",
    },
    {
      name: "设置",
      description: "应用偏好和个人配置。",
      icon: Icons.settings,
      iconAnimation: "rotate",
      href: navBusinessAreaDefaultHrefs.settings,
      active: currentBusinessArea === "settings",
    },
  ];
};

// TODO : 后面需要根据工作空间来设置
// 生成右侧资源导航栏的分组数据。
export const navAreaPanels: NavAreaPanels<NavContext, NavBusinessArea> = {
  personal: ({ pathname }) => ({
    title: "个人空间",
    direction: "left",
    content: [
      {
        items: [
          {
            name: "Prompt",
            icon: Icons.prompt,
            href: navBusinessAreaDefaultHrefs.personal,
            active: pathname === navBusinessAreaDefaultHrefs.personal,
            items: [
              {
                name: "收录",
                href: "/spec/personal/records",
                active: pathname === "/spec/personal/records",
              },
              {
                name: "草稿",
                href: "/spec/personal/drafts",
                active: pathname === "/spec/personal/drafts",
                locked: true,
              },
            ],
          },
          {
            name: "规约库",
            icon: Icons.rulesLibrary,
            href: "/spec/personal/rules",
            active: pathname === "/spec/personal/rules",
          },
        ],
      },
      {
        name: "AI 规约",
        items: [
          {
            name: "AGENTS.md",
            icon: Icons.agentsMd,
            href: "/spec/personal/ai-spec/agents-md",
            active: pathname === "/spec/personal/ai-spec/agents-md",
          },
          {
            name: "Skills",
            icon: Icons.skills,
            href: "/spec/personal/ai-spec/skills",
            active: pathname === "/spec/personal/ai-spec/skills",
          },
          {
            name: "Agents",
            icon: Icons.aiAgents,
            href: "/spec/personal/ai-spec/agents",
            active: pathname === "/spec/personal/ai-spec/agents",
          },
          {
            name: "Plugins",
            description: "管理 AI 工具插件和扩展能力。",
            icon: Icons.plugins,
            href: "/spec/personal/ai-spec/plugins",
            active: pathname === "/spec/personal/ai-spec/plugins",
          },
        ],
      },
    ],
  }),
  team: ({ pathname }) => ({
    title: "工作空间",
    direction: "left",
    content: [
      {
        items: [
          {
            name: "项目",
            icon: Icons.projects,
            href: navBusinessAreaDefaultHrefs.team,
            active: pathname === navBusinessAreaDefaultHrefs.team,
          },
          {
            name: "团队",
            icon: Icons.teamInfo,
            href: "/spec/team/team-set",
            active: pathname === "/spec/team/team-set",
          },
          {
            name: "成员",
            icon: Icons.members,
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
            icon: Icons.agentsMd,
            href: "/spec/team/shared-assets/agents-md",
            active: pathname === "/spec/team/shared-assets/agents-md",
          },
          {
            name: "Skills",
            icon: Icons.skills,
            href: "/spec/team/shared-assets/skills",
            active: pathname === "/spec/team/shared-assets/skills",
          },
          {
            name: "Agents",
            icon: Icons.aiAgents,
            href: "/spec/team/shared-assets/agents",
            active: pathname === "/spec/team/shared-assets/agents",
          },
          {
            name: "Plugins",
            description: "管理团队共享的 AI 工具插件和扩展能力。",
            icon: Icons.plugins,
            href: "/spec/team/shared-assets/plugins",
            active: pathname === "/spec/team/shared-assets/plugins",
          },
        ],
      },
      {
        name: "管理",
        items: [
          {
            name: "安全",
            icon: Icons.security,
            href: "/spec/team/security",
            active: pathname === "/spec/team/security",
          },
          {
            name: "日志",
            icon: Icons.logs,
            href: "/spec/team/logs",
            active: pathname === "/spec/team/logs",
          },
        ],
      },
    ],
  }),
  discover: ({ pathname }) => ({
    title: "发现",
    direction: "left",
    content: [
      {
        items: [
          {
            name: "Prompt",
            icon: Icons.prompt,
            href: navBusinessAreaDefaultHrefs.discover,
            active: pathname === navBusinessAreaDefaultHrefs.discover,
          },
          {
            name: "AGENTS.md",
            icon: Icons.agentsMd,
            href: "/spec/discover/ai-spec/agents-md",
            active: pathname === "/spec/discover/ai-spec/agents-md",
          },
          {
            name: "Skills",
            icon: Icons.skills,
            href: "/spec/discover/ai-spec/skills",
            active: pathname === "/spec/discover/ai-spec/skills",
          },
          {
            name: "Agents",
            icon: Icons.aiAgents,
            href: "/spec/discover/ai-spec/agents",
            active: pathname === "/spec/discover/ai-spec/agents",
          },
          {
            name: "Plugins",
            description: "发现社区共享的 AI 工具插件和扩展能力。",
            icon: Icons.plugins,
            href: "/spec/discover/ai-spec/plugins",
            active: pathname === "/spec/discover/ai-spec/plugins",
          },
        ],
      },
    ],
  }),
  settings: ({ pathname }) => ({
    title: "设置",
    direction: "left",
    content: [
      {
        items: [
          {
            name: "个人详情",
            icon: Icons.profile,
            href: navBusinessAreaDefaultHrefs.settings,
            active: pathname === navBusinessAreaDefaultHrefs.settings,
          },
          {
            name: "个人偏好",
            icon: Icons.preference,
            href: "/spec/settings/preferences",
            active: pathname === "/spec/settings/preferences",
          },
          {
            name: "Key 管理",
            icon: Icons.key,
            href: "/spec/settings/keys",
            active: pathname === "/spec/settings/keys",
          },
        ],
      },
    ],
  }),
};
