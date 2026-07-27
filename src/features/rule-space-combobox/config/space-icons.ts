// # 领域空间图标清单：新建空间时可选的图标，DB 里存 key，渲染时映射回 Icons

import { type Icon, Icons } from "@/shared/ui/icons";

// 可选图标：覆盖代码 / 创作 / 智能体 / 项目等常见领域
export const RULE_SPACE_ICON_OPTIONS = [
	{ key: "rulesLibrary", label: "规约", icon: Icons.rulesLibrary },
	{ key: "code", label: "代码", icon: Icons.code },
	{ key: "palette", label: "创作", icon: Icons.palette },
	{ key: "aiAgents", label: "智能体", icon: Icons.aiAgents },
	{ key: "prompt", label: "笔记", icon: Icons.prompt },
	{ key: "skills", label: "手册", icon: Icons.skills },
	{ key: "projects", label: "项目", icon: Icons.projects },
	{ key: "star", label: "收藏", icon: Icons.star },
] as const satisfies readonly { key: string; label: string; icon: Icon }[];

// 默认图标 key：与后端 DEFAULT_RULE_SPACE_ICON 保持一致
export const DEFAULT_SPACE_ICON_KEY = "rulesLibrary";

// > 图标 key → 图标组件；历史数据或未知 key 回落默认图标
export const resolveSpaceIcon = (key?: string): Icon =>
	RULE_SPACE_ICON_OPTIONS.find((option) => option.key === key)?.icon ?? Icons.rulesLibrary;
