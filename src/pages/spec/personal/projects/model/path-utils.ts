// # 项目文档路径工具：把扁平 path 列表推导成内存文件夹树（项目内文件夹不建表，靠路径前缀推导层级）

import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";

// 虚拟根节点 id：headless-tree 从它向下取子节点，根本身不渲染
export const PROJECT_TREE_ROOT_ID = "root";

// 树节点：文件夹有 children（子节点 id 列表），文件节点无 children
export interface ProjectTreeNode {
	name: string;
	children?: string[];
}

// @ 路径拆分与祖先推导

// 把路径型 id 拆成累计前缀，如 "a/b/c" → ["a", "a/b", "a/b/c"]；供面包屑分段与祖先展开使用
export const getPathIds = (pathId: string): string[] => {
	const parts = pathId.split("/");
	return parts.map((_, index) => parts.slice(0, index + 1).join("/"));
};

// @ 扁平文档列表 → 内存文件夹树

// 从全量文档列表构建树节点表：文件夹节点从 path 前缀派生，文件节点对应实际文档
// 返回值包含虚拟根节点（PROJECT_TREE_ROOT_ID），其 children 为顶层文件夹/文件
export const buildProjectTree = (
	projectId: string,
	agentsMds: AgentsMdListItemVo[],
): Record<string, ProjectTreeNode> => {
	const nodes: Record<string, ProjectTreeNode> = {
		[PROJECT_TREE_ROOT_ID]: { name: "root", children: [projectId] },
		// 项目根本身作为树的第一层节点，选中时可看项目全部文档
		[projectId]: { name: projectId, children: [] },
	};

	const projectNode = nodes[projectId];
	if (!projectNode.children) projectNode.children = [];

	for (const agentsMd of agentsMds) {
		const segments = agentsMd.path.split("/");
		// 末段是文件名，前面的段是文件夹层级
		const folderSegments = segments.slice(0, -1);
		// 累计前缀 id：["app","api"] → ["app","app/api"]
		const folderIds = folderSegments.map((_, index) =>
			folderSegments.slice(0, index + 1).join("/"),
		);

		// 建立各层文件夹节点，父子挂接
		let parentId = projectId;
		for (const [index, folderId] of folderIds.entries()) {
			if (!nodes[folderId]) {
				nodes[folderId] = { name: folderSegments[index], children: [] };
				projectAppendChild(nodes, parentId, folderId);
			}
			parentId = folderId;
		}
		// 文件节点挂在最后一个文件夹下（顶层文档直接挂项目根）
		nodes[agentsMd.id] = { name: segments[segments.length - 1] };
		projectAppendChild(nodes, parentId, agentsMd.id);
	}

	return nodes;
};

// 把 childId 追加到 parentId 的 children（去重，文件夹排前、文件排后）
const projectAppendChild = (
	nodes: Record<string, ProjectTreeNode>,
	parentId: string,
	childId: string,
): void => {
	const parent = nodes[parentId];
	if (!parent?.children) return;
	if (parent.children.includes(childId)) return;
	parent.children.push(childId);
};

// @ 树数据读取辅助（消费 buildProjectTree 的结果）

// 取某节点下的子文件夹 id（过滤掉文件节点）；左侧树只渲染文件夹
export const getSubfolderIds = (itemId: string, tree: Record<string, ProjectTreeNode>): string[] =>
	(tree[itemId]?.children ?? []).filter((childId) => Boolean(tree[childId]?.children));

// 递归收集某文件夹子树内的全部文档，供右侧卡片列表展示
export const collectFolderAgentsMds = (
	folderId: string,
	tree: Record<string, ProjectTreeNode>,
	agentsMds: AgentsMdListItemVo[],
): AgentsMdListItemVo[] => {
	const agentsMdIds = new Set<string>();
	const stack = [folderId];
	while (stack.length > 0) {
		const id = stack.pop();
		if (!id) continue;
		const node = tree[id];
		if (!node?.children) continue; // 文件节点跳过
		for (const childId of node.children) {
			if (tree[childId]?.children) {
				stack.push(childId);
			} else {
				agentsMdIds.add(childId);
			}
		}
	}
	return agentsMds.filter((agentsMd) => agentsMdIds.has(agentsMd.id));
};
