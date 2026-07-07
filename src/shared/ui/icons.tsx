import type { TablerIcon } from "@tabler/icons-react";
import {
	IconAdjustmentsAlt,
	IconArrowBarLeft,
	IconArrowUpRight,
	IconBook,
	IconBrandMetabrainz,
	IconBrandTeams,
	IconBrightness,
	IconCalendar,
	IconCamera,
	IconCompass,
	IconCopy,
	IconDots,
	IconEye,
	IconEyeOff,
	IconFileAi,
	IconFiles,
	IconFileText,
	IconFolder,
	IconGift,
	IconHelpCircle,
	IconHelpSquareRounded,
	IconKey,
	IconLayoutSidebarLeftExpand,
	IconLogin,
	IconLogout,
	IconMoonStars,
	IconNote,
	IconPalette,
	IconPencil,
	IconPlug,
	IconPlus,
	IconRepeat,
	IconSettings,
	IconShield,
	IconSparkleHighlight,
	IconSun,
	IconTrash,
	IconUpload,
	IconUserCircle,
	IconUserFilled,
	IconUsers,
	IconUsersGroup,
} from "@tabler/icons-react";
import type { ComponentType, SVGProps } from "react";

import { LogoIcon } from "@/shared/assets/icons/logo";

// 图标组件类型，兼容 tabler 图标和自定义 SVG 图标组件。
export type Icon = TablerIcon | ComponentType<SVGProps<SVGSVGElement>>;

// 统一管理应用内可复用图标，避免业务组件直接依赖图标库。
export const Icons = {
	logo: LogoIcon,

	// header
	brightness: IconBrightness,
	palette: IconPalette,

	// business nav
	personal: IconSparkleHighlight,
	team: IconBrandTeams,
	discover: IconCompass,
	settings: IconSettings,

	prompt: IconNote,
	agentsMd: IconFileAi,
	rulesLibrary: IconFolder,
	skills: IconBook,
	aiAgents: IconBrandMetabrainz,
	plugins: IconPlug,
	projects: IconFiles,
	members: IconUsers,
	preference: IconAdjustmentsAlt,
	key: IconKey,
	profile: IconUserCircle,
	teamInfo: IconUsersGroup,
	security: IconShield,
	logs: IconFileText,

	login: IconLogin,
	gift: IconGift,
	helpCircle: IconHelpCircle,
	helpSquareRounded: IconHelpSquareRounded,
	logout: IconLogout,

	// sidebar 折叠/展开切换
	sidebarCollapse: IconArrowBarLeft,
	sidebarExpand: IconLayoutSidebarLeftExpand,

	// sidebar 宽度重置
	sidebarReset: IconRepeat,

	avatarPlaceholder: IconUserFilled,
	avatarEdit: IconCamera,
	upload: IconUpload,

	copy: IconCopy,
	calendar: IconCalendar,
	eye: IconEye,
	eyeOff: IconEyeOff,

	// 列表通用操作
	plus: IconPlus,
	more: IconDots,
	pencil: IconPencil,
	trash: IconTrash,
	promote: IconArrowUpRight,

	themeLight: IconSun,
	themeDark: IconMoonStars,
};
