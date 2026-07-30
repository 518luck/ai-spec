// # 标签（Tag）测试模板：12 个业务标签 + 12 个边缘标签，覆盖字符类型与长度边界

export type TagTemplate = {
	name: string;
	color: string;
};

// @ 业务标签：常见规约分类标记
export const tagBusinessTemplates: TagTemplate[] = [
	{ name: "必须遵守", color: "#8b5cf6" },
	{ name: "推荐实践", color: "#ec4899" },
	{ name: "已废弃", color: "#06b6d4" },
	{ name: "待评审", color: "#3b82f6" },
	{ name: "核心规范", color: "#10b981" },
	{ name: "进阶指南", color: "#f59e0b" },
	{ name: "新手必读", color: "#8b5cf6" },
	{ name: "性能相关", color: "#ec4899" },
	{ name: "安全相关", color: "#06b6d4" },
	{ name: "兼容性", color: "#3b82f6" },
	{ name: "可选方案", color: "#10b981" },
	{ name: "实验性功能", color: "#f59e0b" },
];

// @ 边缘标签：测名称长度上限、单字符、emoji、符号、数字、混排等字符类型
// 正好 32 字符的标签名
const EDGE_TAG_32_NAME = "一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二";

export const tagEdgeTemplates: TagTemplate[] = [
	// 长度边界：正好 32 字符
	{ name: EDGE_TAG_32_NAME, color: "#8b5cf6" },
	// 单字符
	{ name: "A", color: "#ec4899" },
	// 纯英文
	{ name: "important", color: "#06b6d4" },
	// emoji
	{ name: "🔥热门", color: "#3b82f6" },
	// 符号包裹
	{ name: "#话题#", color: "#10b981" },
	// 纯数字
	{ name: "P0", color: "#f59e0b" },
	// 中英混排长名
	{ name: "Mixed 中英混合 Long Tag", color: "#8b5cf6" },
	// 纯符号
	{ name: "★★★", color: "#ec4899" },
	// 含引号
	{ name: '"引号标签"', color: "#06b6d4" },
	// 含反斜杠
	{ name: "路径\\文件", color: "#3b82f6" },
	// HTML 实体名（字面存储，非转义）
	{ name: "&lt;实体&gt;", color: "#10b981" },
	// 超长英文名
	{ name: "Super Long English Tag Name Test", color: "#f59e0b" },
];

// 全部标签模板
export const allTagTemplates: TagTemplate[] = [...tagBusinessTemplates, ...tagEdgeTemplates];

// 所有测试标签名称（用于清理隔离）
export const TAG_NAMES = allTagTemplates.map((t) => t.name);
