// # 领域空间（RuleSpace）测试模板：6 个业务领域 + 2 个边缘领域

// 领域模板：icon 取自前端 RULE_SPACE_ICON_OPTIONS 的合法 key，颜色取自预设色盘
export type SpaceTemplate = {
	name: string;
	icon: string;
	color: string;
};

// @ 业务领域：覆盖常见开发场景分类
export const spaceTemplates: SpaceTemplate[] = [
	{ name: "代码规范", icon: "code", color: "#ef4444" },
	{ name: "设计规约", icon: "palette", color: "#f59e0b" },
	{ name: "AI 智能体", icon: "aiAgents", color: "#eab308" },
	{ name: "数据库约定", icon: "database", color: "#10b981" },
	{ name: "安全合规", icon: "shield", color: "#3b82f6" },
	{ name: "项目管理", icon: "projects", color: "#ef4444" },
];

// @ 边缘领域：测名称长度上限与纯英文存储
// 正好 32 字符的名称（三十字 + 二字补足）
export const EDGE_SPACE_32_NAME =
	"一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二";

export const edgeSpaceTemplates: SpaceTemplate[] = [
	{ name: EDGE_SPACE_32_NAME, icon: "domain", color: "#f59e0b" },
	{ name: "Test Domain For Edge Case", icon: "star", color: "#3b82f6" },
];

// 全部领域模板：业务 + 边缘
export const allSpaceTemplates: SpaceTemplate[] = [...spaceTemplates, ...edgeSpaceTemplates];

// 所有测试领域名称清单（用于清理时按名隔离，不影响现有个人默认空间）
export const SPACE_NAMES = allSpaceTemplates.map((s) => s.name);
