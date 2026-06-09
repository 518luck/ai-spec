import type { TablerIcon } from "@tabler/icons-react";
import {
  IconAdjustmentsAlt,
  IconBrandTeams,
  IconBrightness,
  IconCompass,
  IconEye,
  IconEyeOff,
  IconGift,
  IconHelpCircle,
  IconKey,
  IconFileText,
  IconPalette,
  IconRobot,
  IconSettings,
  IconShield,
  IconSparkleHighlight,
  IconTextScanAi,
  IconUserCircle,
  IconUsersGroup,
} from "@tabler/icons-react";
import type { ComponentType, SVGProps } from "react";

// 图标组件类型，兼容 tabler 图标和自定义 SVG 图标组件。
export type Icon = TablerIcon | ComponentType<SVGProps<SVGSVGElement>>;

// 统一管理应用内可复用图标，避免业务组件直接依赖图标库。
export const Icons = {
  logo: IconRobot,

  // header
  brightness: IconBrightness,
  palette: IconPalette,

  // business nav
  discover: IconCompass,
  team: IconBrandTeams,
  personal: IconSparkleHighlight,

  settings: IconSettings,
  prompt: IconTextScanAi,
  preference: IconAdjustmentsAlt,
  key: IconKey,
  profile: IconUserCircle,
  teamInfo: IconUsersGroup,
  security: IconShield,
  logs: IconFileText,

  gift: IconGift,
  helpCircle: IconHelpCircle,

  eye: IconEye,
  eyeOff: IconEyeOff,
};
