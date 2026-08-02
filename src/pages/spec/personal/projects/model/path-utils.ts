// # 项目树工具：从文件夹表（parentId 树）+ 配置多对多挂载构建内存树，供文件树/面包屑/卡片收集使用

import type { AgentsMdListItemVo, ProjectFolderListItemVo } from "@/shared/lib/zod/schemas/project";

// 虚拟根节点 id：headless-tree 从它向下取子节点，根本身不渲染
export const PROJECT_TREE_ROOT_ID = "root";

// 树节点：文件夹有 children（子节点 id 列表），文件节点无 children
export interface ProjectTreeNode {
	name: string;
	children?: string[];
}

// @ 树构建

// 从文件夹表与配置挂载关系构建节点表：文件夹节点来自表记录（parentId 挂接），
// 配置节点（多对多）挂到其所有挂载文件夹下；虚拟根 children 为项目根文件夹
// @param rootFolderId 项目根文件夹 id（parentId=null 的记录），树第一行
// @param projectName 项目根显示名（不传回退 rootFolderId）
export const buildProjectTree = (
	folders: ProjectFolderListItemVo[],
	agentsMds: AgentsMdListItemVo[],
	rootFolderId: string,
	projectName?: string,
): Record<string, ProjectTreeNode> => {
	const nodes: Record<string, ProjectTreeNode> = {
		[PROJECT_TREE_ROOT_ID]: { name: "root", children: [rootFolderId] },
		// 根文件夹作为树的第一行，显示项目名
		[rootFolderId]: { name: projectName ?? rootFolderId, children: [] },
	};

	// 先物化全部文件夹节点，再按 parentId 挂接（根文件夹已预建，跳过自身挂接）
	for (const folder of folders) {
		if (!nodes[folder.id]) {
			nodes[folder.id] = { name: folder.name, children: [] };
		}
	}
	for (const folder of folders) {
		if (folder.id === rootFolderId) continue;
		// 顶层文件夹 parentId 为 null，挂项目根文件夹下
		projectAppendChild(nodes, folder.parentId ?? rootFolderId, folder.id);
	}

	// 配置节点（多对多）挂到其所有挂载文件夹下
	for (const agentsMd of agentsMds) {
		nodes[agentsMd.id] = { name: agentsMd.name };
		for (const folderId of agentsMd.folderIds) {
			projectAppendChild(nodes, folderId, agentsMd.id);
		}
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

// 取某节点到项目根文件夹的祖先链（含两端），供缩进线高亮 / 展开祖先 / 面包屑使用
// > 沿 children 反查父：内存树规模小，O(n) 遍历可接受；虚拟根不进入链，找不到父时提前退出（防御数据残缺）
export const getFolderAncestorIds = (
	folderId: string,
	tree: Record<string, ProjectTreeNode>,
): string[] => {
	const chain: string[] = [folderId];
	let currentId = folderId;
	while (currentId !== PROJECT_TREE_ROOT_ID) {
		const parentId = Object.keys(tree).find((id) => tree[id].children?.includes(currentId));
		// 父为虚拟根或缺失时停止（根文件夹是链的顶端）
		if (!parentId || parentId === currentId || parentId === PROJECT_TREE_ROOT_ID) break;
		chain.unshift(parentId);
		currentId = parentId;
	}
	return chain;
};

// 收集树内全部文件夹的 id → 名字映射（含项目根文件夹）；供图标预解析遍历使用
export const collectFolderNames = (
	tree: Record<string, ProjectTreeNode>,
): Record<string, string> => {
	const result: Record<string, string> = {};
	// 从虚拟根开始（跳过不渲染的虚拟根），DFS 收集全部文件夹
	const stack = (tree[PROJECT_TREE_ROOT_ID]?.children ?? []).slice();
	while (stack.length > 0) {
		const id = stack.pop();
		if (!id) continue;
		const node = tree[id];
		if (!node?.children) continue; // 文件节点跳过
		result[id] = node.name;
		stack.push(...getSubfolderIds(id, tree));
	}
	return result;
};

// 递归收集某文件夹子树内的全部配置，供右侧卡片列表展示（多对多：同一配置挂多个文件夹时各子树独立收集，Set 去重）
export const collectFolderAgentsMds = (
	folderId: string,
	tree: Record<string, ProjectTreeNode>,
	agentsMds: AgentsMdListItemVo[],
): AgentsMdListItemVo[] => {
	// DFS 遍历子树：文件夹节点继续下钻，文件节点（无 children）收集其 id
	const agentsMdIds = new Set<string>();
	const stack = [folderId];
	while (stack.length > 0) {
		const id = stack.pop();
		if (!id) continue;
		const children = tree[id]?.children;
		if (!children) continue; // 文件节点跳过
		for (const childId of children) {
			if (tree[childId]?.children) stack.push(childId);
			else agentsMdIds.add(childId);
		}
	}
	return agentsMds.filter((agentsMd) => agentsMdIds.has(agentsMd.id));
};
