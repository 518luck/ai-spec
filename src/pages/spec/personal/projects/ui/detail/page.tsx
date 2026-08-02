// # 项目内视图：顶部面包屑 + 左侧文件夹树 + 右侧配置卡片 / 阅读
//
// ! 服务端组件（React Server Component）：文件无 "use client"，默认为服务端组件；
//   仅承担数据预取（auth/项目/配置/文件夹）与图标预解析，交互状态全部委托给 ProjectDetailClient

import type { JSX } from "react";

import { listAgentsMds } from "@/server/domain/agents-mds/services";
import { getProjectById, listProjectFolders } from "@/server/domain/projects/services";
import { auth } from "@/shared/lib/auth/auth";
import { TitlePageShell } from "@/widgets/page-shell";
import { buildProjectTree, collectFolderNames } from "../../model/path-utils";
import { ProjectDetailClient } from "./detail-client";
import { preloadFolderIconPairs } from "./folder-icons";

type ProjectDetailPageProps = {
	/** 当前打开的项目 id（来自 URL 参数） */
	projectId: string;
};

// > 服务端组件：预取项目信息 + 配置列表，按文件夹名预解析图标后下发给客户端
export async function ProjectDetailPage({
	projectId,
}: ProjectDetailPageProps): Promise<JSX.Element> {
	const session = await auth();
	const userId = session?.user?.id;
	// 未登录返回壳子，客户端路由会因 oRPC 401 自动重定向到登录页
	const project = userId ? await getProjectById({ userId, id: projectId }).catch(() => null) : null;
	const agentsMds = userId && project ? await listAgentsMds({ userId, projectId }) : [];
	// 文件夹树（parentId 自关联）+ 根文件夹：树第一行与顶层配置的挂载点
	const projectFolders = userId && project ? await listProjectFolders({ userId, projectId }) : [];
	const rootFolderId = projectFolders.find((folder) => folder.parentId === null)?.id ?? "";
	const projectName = project?.name ?? projectId;

	// 收集树内文件夹名 → 预解析图标对（根用 root 图标，其余按名字匹配）
	const tree = buildProjectTree(projectFolders, agentsMds, rootFolderId, projectName);
	const { iconsMap, defaultIconPair } = await preloadFolderIconPairs(
		collectFolderNames(tree),
		rootFolderId,
	);

	return (
		<TitlePageShell title={projectName} scrollable={false}>
			<ProjectDetailClient
				projectId={projectId}
				projectName={projectName}
				agentsMds={agentsMds}
				projectFolders={projectFolders}
				rootFolderId={rootFolderId}
				iconsMap={iconsMap}
				defaultIconPair={defaultIconPair}
			/>
		</TitlePageShell>
	);
}
