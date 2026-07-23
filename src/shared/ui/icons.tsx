// # 图标统一注册表：把 tabler 图标库和自封装 SVG 图标收敛在一处，业务组件只依赖 Icons 而不直接依赖图标库

import type { TablerIcon } from "@tabler/icons-react";
import {
	IconAdjustmentsAlt,
	IconAdjustmentsHorizontal,
	IconArrowBarLeft,
	IconArrowsDiagonal,
	IconArrowsDiagonalMinimize2,
	IconArrowsLeftRight,
	IconArrowUpRight,
	IconBold,
	IconBook,
	IconBrandMetabrainz,
	IconBrandTeams,
	IconBrightness,
	IconCalendar,
	IconCamera,
	IconCheck,
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconChevronUp,
	IconClock,
	IconCode,
	IconCompass,
	IconCopy,
	IconDots,
	IconEye,
	IconEyeCode,
	IconEyeOff,
	IconEyeSearch,
	IconFileAi,
	IconFiles,
	IconFileText,
	IconFilter2,
	IconFolder,
	IconFolderX,
	IconFolderPlus,
	IconGift,
	IconH1,
	IconHelpCircle,
	IconHelpSquareRounded,
	IconItalic,
	IconKey,
	IconLayoutSidebarLeftExpand,
	IconLink,
	IconLogin,
	IconLogout,
	IconMoonStars,
	IconNote,
	IconPalette,
	IconPencil,
	IconPlug,
	IconPlus,
	IconQuote,
	IconRepeat,
	IconFold,
	IconHighlight,
	IconListNumbers,
	IconSearch,
	IconSelector,
	IconSettings,
	IconShield,
	IconSparkleHighlight,
	IconStar,
	IconSun,
	IconTag,
	IconTagPlus,
	IconTrash,
	IconTrendingUp,
	IconUpload,
	IconUserCircle,
	IconUserFilled,
	IconUsers,
	IconUsersGroup,
	IconX,
} from "@tabler/icons-react";
import type { ComponentType, SVGProps } from "react";

import { LogoIcon } from "@/shared/assets/icons/logo";
import { SquaresIcon } from "@/shared/assets/icons/squares";

// @ 图标组件类型：兼容 tabler 图标（TablerIcon）和自封装 SVG 图标组件
export type Icon = TablerIcon | ComponentType<SVGProps<SVGSVGElement>>;

// @ 图标注册表：按使用场景分组，新增图标在此登记后即可通过 Icons.xxx 使用
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
	eyeSearch: IconEyeSearch,
	eyeCode: IconEyeCode,

	// 表单/选择控件
	check: IconCheck,
	chevronDown: IconChevronDown,
	chevronLeft: IconChevronLeft,
	chevronRight: IconChevronRight,
	chevronUp: IconChevronUp,
	selector: IconSelector,
	folderClosed: IconFolder,
	folderX: IconFolderX,
	folderPlus: IconFolderPlus,
	squares: SquaresIcon,
	tag: IconTag,
	tagAdd: IconTagPlus,
	star: IconStar,

	// Markdown 编辑器快捷操作
	bold: IconBold,
	italic: IconItalic,
	heading1: IconH1,
	quote: IconQuote,
	code: IconCode,
	link: IconLink,

	// 编辑器视图设置
	lineNumbers: IconListNumbers,
	fold: IconFold,
	highlight: IconHighlight,

	// 列表通用操作
	plus: IconPlus,
	more: IconDots,
	pencil: IconPencil,
	trash: IconTrash,
	trending: IconTrendingUp,
	promote: IconArrowUpRight,
	expand: IconArrowsDiagonal,
	minimize: IconArrowsDiagonalMinimize2,
	search: IconSearch,
	filter: IconAdjustmentsHorizontal,
	filter2: IconFilter2,
	x: IconX,

	themeLight: IconSun,
	themeDark: IconMoonStars,

	// 版本历史
	history: IconClock,
	compare: IconArrowsLeftRight,
};
