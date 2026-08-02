// # 配置列表项组装：从配置内容提取摘要并组装列表项 Vo，多个 service（列表/创建/全项目搜索）复用

import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";

// 摘要截断长度（字符数）
const EXCERPT_LENGTH = 120;

// 从配置内容提取摘要（首个非标题正文行，超长截断）；标题直接用文件名 name
export const makeAgentsMdListItem = (
	id: string,
	name: string,
	content: string,
	folderIds: string[],
): AgentsMdListItemVo => {
	const lines = content.split("\n");
	const firstLine = lines.find((line) => line.trim() && !line.startsWith("#")) ?? "";
	const excerpt =
		firstLine.length > EXCERPT_LENGTH ? `${firstLine.slice(0, EXCERPT_LENGTH)}...` : firstLine;
	return { id, name, excerpt, folderIds };
};
