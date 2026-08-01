// # 项目内视图：顶部面包屑 + 左侧文件夹树 + 右侧文档卡片 / 阅读

import type { JSX } from "react";

import { listAgentsMds } from "@/server/domain/agents-mds";
import { getProjectById } from "@/server/domain/projects/services";
import { auth } from "@/shared/lib/auth/auth";
import { TitlePageShell } from "@/widgets/page-shell";
import { buildProjectTree, collectFolderNames } from "../../model/path-utils";
import { ProjectDetailClient } from "./detail-client";
import { preloadFolderIconPairs } from "./folder-icons";

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

	// 收集树内文件夹名 → 预解析图标对（根用 root 图标，其余按名字匹配）
	const tree = buildProjectTree(projectId, agentsMds, projectName);
	const { iconsMap, defaultIconPair } = await preloadFolderIconPairs(
		collectFolderNames(projectId, tree, projectName),
		projectId,
	);

	return (
		<TitlePageShell title={projectName} scrollable={false}>
			<ProjectDetailClient
				projectId={projectId}
				projectName={projectName}
				agentsMds={agentsMds}
				iconsMap={iconsMap}
				defaultIconPair={defaultIconPair}
			/>
		</TitlePageShell>
	);
}
