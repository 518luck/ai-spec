// # 项目内视图：顶部面包屑 + 左侧文件夹树 + 右侧文档卡片 / 阅读

import type { JSX } from "react";

import { listAgentsMds } from "@/server/domain/agents-mds";
import { getProjectById } from "@/server/domain/projects/services";
import { auth } from "@/shared/lib/auth/auth";
import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { TitlePageShell } from "@/widgets/page-shell";
import { buildProjectTree, getSubfolderIds, PROJECT_TREE_ROOT_ID } from "../../model/path-utils";
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

// > 服务端组件：预取项目信息 + 文档列表，按文件夹名预解析图标后下发给客户端
export async function ProjectDetailPage({
	projectId,
}: ProjectDetailPageProps): Promise<JSX.Element> {
	const session = await auth();
	const userId = session?.user?.id;
	// 未登录返回壳子，客户端路由会因 oRPC 401 自动重定向到登录页
	const project = userId ? await getProjectById({ userId, id: projectId }).catch(() => null) : null;
	const agentsMds = userId && project ? await listAgentsMds({ userId, projectId }) : [];
	const projectName = project?.name ?? projectId;

	const { iconsMap, defaultIconPair } = await preloadFolderIcons(projectId, agentsMds);

	return (
		<TitlePageShell title={projectName} scrollable={false}>
			<ProjectDetailClient
				projectId={projectId}
				agentsMds={agentsMds}
				iconsMap={iconsMap}
				defaultIconPair={defaultIconPair}
			/>
		</TitlePageShell>
	);
}

// 预解析项目内所有文件夹图标：folder 名 → iconId → 动态加载 SVG
// 树结构由扁平文档列表按 path 前缀推导，图标按文件夹名匹配 material-icon-theme
const preloadFolderIcons = async (
	projectId: string,
	agentsMds: AgentsMdListItemVo[],
): Promise<{ iconsMap: Record<string, FolderIconPair>; defaultIconPair: FolderIconPair }> => {
	const tree = buildProjectTree(projectId, agentsMds);
	// 收集树内全部文件夹 itemId（含项目根本身）
	const folderIds: string[] = [];
	const stack = [PROJECT_TREE_ROOT_ID];
	while (stack.length > 0) {
		const id = stack.pop();
		if (!id) continue;
		const node = tree[id];
		if (!node?.children) continue; // 文件节点跳过
		folderIds.push(id);
		stack.push(...getSubfolderIds(id, tree));
	}

	// itemId → iconId；项目根用 root 图标，其余按文件夹名解析
	const itemIdToIconId: Record<string, string> = {};
	for (const folderId of folderIds) {
		const isRoot = folderId === projectId;
		const name = tree[folderId]?.name ?? "";
		itemIdToIconId[folderId] = isRoot ? ROOT_FOLDER_ICON_ID : resolveFolderIconId(name);
	}

	// 去重 iconId 后并发加载，兜底图标一并加载
	const uniqueIconIds = [...new Set(Object.values(itemIdToIconId))];
	uniqueIconIds.push(DEFAULT_FOLDER_ICON_ID);
	const loadedPairs = await Promise.all(
		uniqueIconIds.map(async (iconId) => [iconId, await loadFolderIconPair(iconId)] as const),
	);
	const pairByIconId: Record<string, FolderIconPair> = Object.fromEntries(loadedPairs);

	// itemId → 图标对；兜底图标单独取出
	const iconsMap: Record<string, FolderIconPair> = {};
	for (const [folderId, iconId] of Object.entries(itemIdToIconId)) {
		iconsMap[folderId] = pairByIconId[iconId];
	}

	return { iconsMap, defaultIconPair: pairByIconId[DEFAULT_FOLDER_ICON_ID] };
};
