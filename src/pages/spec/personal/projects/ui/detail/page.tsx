// # 项目内视图：顶部面包屑 + 左侧文件夹树 + 右侧文档卡片 / 阅读

import type { JSX } from "react";

import { TitlePageShell } from "@/widgets/page-shell";
import { agentsTreeItems } from "../../model/mock-tree";
import { ProjectDetailClient } from "./detail-client";
import {
	DEFAULT_FOLDER_ICON_ID,
	type FolderIconPair,
	loadFolderIconPair,
	ROOT_FOLDER_ICON_ID,
	resolveFolderIconId,
} from "./folder-icons";

type ProjectDetailPageProps = {
	/** 当前打开的项目 id（来自 URL 参数） */
	projectId: string;
};

// > 服务端组件：预解析项目子树内所有文件夹的图标，按需动态加载后下发给客户端
export async function ProjectDetailPage({
	projectId,
}: ProjectDetailPageProps): Promise<JSX.Element> {
	const { iconsMap, defaultIconPair } = await preloadFolderIcons(projectId);
	// 页面标题用项目名，取不到时回退到 id（与列表卡片取名逻辑一致）
	const projectName = agentsTreeItems[projectId]?.name ?? projectId;

	return (
		<TitlePageShell title={projectName} scrollable={false}>
			<ProjectDetailClient
				projectId={projectId}
				iconsMap={iconsMap}
				defaultIconPair={defaultIconPair}
			/>
		</TitlePageShell>
	);
}

/** 收集某项目子树内的全部文件夹 itemId（含项目根本身），用于预解析图标 */
const collectFolderIds = (projectId: string): string[] => {
	const folderIds: string[] = [];
	const stack = [projectId];
	while (stack.length > 0) {
		const id = stack.pop();
		if (!id) continue;
		const node = agentsTreeItems[id];
		if (!node?.children) continue; // 文件节点（无 children）跳过
		folderIds.push(id);
		stack.push(...node.children);
	}
	return folderIds;
};

/**
 * 预解析项目内所有文件夹图标：folder 名 → iconId → 动态加载 SVG 对
 *
 * 根节点用 ROOT_FOLDER_ICON_ID，其余按文件夹名解析，未命中回退 DEFAULT_FOLDER_ICON_ID；
 * 去重后并发加载，避免同一 iconId 重复请求
 */
const preloadFolderIcons = async (
	projectId: string,
): Promise<{ iconsMap: Record<string, FolderIconPair>; defaultIconPair: FolderIconPair }> => {
	const folderIds = collectFolderIds(projectId);

	// itemId → iconId；根节点固定 root 图标，其余按名解析
	const itemIdToIconId: Record<string, string> = {};
	for (const folderId of folderIds) {
		const isRoot = folderId === projectId;
		const name = agentsTreeItems[folderId]?.name ?? "";
		itemIdToIconId[folderId] = isRoot ? ROOT_FOLDER_ICON_ID : resolveFolderIconId(name);
	}

	// 去重 iconId 后并发加载，避免重复请求同一图标对
	const uniqueIconIds = [...new Set(Object.values(itemIdToIconId))];
	uniqueIconIds.push(DEFAULT_FOLDER_ICON_ID); // 兜底图标也一并加载

	const loadedPairs = await Promise.all(
		uniqueIconIds.map(async (iconId) => [iconId, await loadFolderIconPair(iconId)] as const),
	);
	const pairByIconId: Record<string, FolderIconPair> = Object.fromEntries(loadedPairs);

	// itemId → 图标对；兜底图标单独取出
	const iconsMap: Record<string, FolderIconPair> = {};
	for (const [folderId, iconId] of Object.entries(itemIdToIconId)) {
		iconsMap[folderId] = pairByIconId[iconId];
	}

	return {
		iconsMap,
		defaultIconPair: pairByIconId[DEFAULT_FOLDER_ICON_ID],
	};
};
