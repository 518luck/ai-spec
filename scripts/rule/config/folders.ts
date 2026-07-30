// # 文件夹（Folder）测试模板：跨领域分布 + 边缘名称/描述长度边界

import { EDGE_SPACE_32_NAME } from "./spaces";

// 文件夹模板：spaceName 用于绑定到对应领域，description 测描述字段长度边界
export type FolderTemplate = {
	name: string;
	description: string;
	spaceName: string;
};

// @ 业务文件夹：按领域分布，覆盖各领域下的细分主题
export const folderTemplates: FolderTemplate[] = [
	// 代码规范（4 个）
	{ name: "函数规范", description: "函数声明、参数、返回值相关约定", spaceName: "代码规范" },
	{ name: "类型规范", description: "TypeScript 类型声明与推导约定", spaceName: "代码规范" },
	{ name: "错误处理", description: "异常捕获与错误码约定", spaceName: "代码规范" },
	{ name: "命名约定", description: "变量、函数、文件命名规则", spaceName: "代码规范" },
	// 设计规约（2 个）
	{ name: "组件规范", description: "React 组件结构与拆分约定", spaceName: "设计规约" },
	{ name: "样式规范", description: "Tailwind 与 CSS 变量使用约定", spaceName: "设计规约" },
	// AI 智能体（2 个）
	{ name: "Prompt 设计", description: "提示词编写与结构化约定", spaceName: "AI 智能体" },
	{ name: "工作流编排", description: "智能体工作流与工具调用约定", spaceName: "AI 智能体" },
	// 数据库约定（2 个）
	{ name: "Schema 规范", description: "表结构与字段命名约定", spaceName: "数据库约定" },
	{ name: "查询优化", description: "索引与查询性能约定", spaceName: "数据库约定" },
	// 安全合规（2 个）
	{ name: "认证授权", description: "鉴权、会话与权限约定", spaceName: "安全合规" },
	{ name: "数据保护", description: "敏感数据处理与脱敏约定", spaceName: "安全合规" },
	// 项目管理（3 个）
	{ name: "Git 规范", description: "分支、提交与合并约定", spaceName: "项目管理" },
	{ name: "发布流程", description: "版本发布与回滚约定", spaceName: "项目管理" },
	{ name: "代码评审", description: "PR 评审与合并标准", spaceName: "项目管理" },
	// 未分类测试文件夹（1 个）：用于测 folderId=null 之外的常规未归档场景
	{ name: "待整理", description: "尚未归类到具体文件夹的临时规约", spaceName: "代码规范" },
	{ name: "归档", description: "已过时但保留参考价值的规约", spaceName: "项目管理" },
	{ name: "草稿", description: "正在编写尚未定稿的规约", spaceName: "设计规约" },
];

// @ 边缘文件夹：测名称 32 字符上限与描述 200 字符上限
// 正好 32 字符的文件夹名称
const EDGE_FOLDER_32_NAME = "前端规范总集函数组件类型样式性能安全测试目录一二三四五六七八九十";

// 正好 200 字符的描述：重复填充到精确 200 字
const EDGE_FOLDER_200_DESC = "这是一段用于测试文件夹描述字段长度上限的文本，正好两百字。"
	.repeat(10)
	.slice(0, 200);

export const edgeFolderTemplates: FolderTemplate[] = [
	{
		name: EDGE_FOLDER_32_NAME,
		description: EDGE_FOLDER_200_DESC,
		spaceName: "代码规范",
	},
	{
		name: "Edge Folder English Name Only",
		description: "",
		spaceName: "Test Domain For Edge Case",
	},
	{
		// 绑定到 32 字符名边缘领域，确保所有测试领域都有文件夹覆盖
		name: "边缘领域下的文件夹",
		description: "挂在 32 字符名边缘领域下，验证长名称领域的绑定",
		spaceName: EDGE_SPACE_32_NAME,
	},
];

// 全部文件夹模板
export const allFolderTemplates: FolderTemplate[] = [...folderTemplates, ...edgeFolderTemplates];
