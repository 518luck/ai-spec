"use client";

// # 项目内视图客户端容器：持有选中/展开/阅读状态，渲染面包屑 + 文件夹树 + 文档区

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useMemo, useState } from "react";

import { client } from "@/shared/lib/orpc/client";
import { projectKeys } from "@/shared/lib/orpc/query-keys";
import type { AgentsMdListItemVo } from "@/shared/lib/zod/schemas/project";
import { Icons } from "@/shared/ui/icons";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { EmptyState } from "@/widgets/empty-state";
import { buildProjectTree, collectFolderAgentsMds, getPathIds } from "../../model/path-utils";
import { AgentsMdCardGrid } from "./agents-md-cards";
import type { FolderIconPair } from "./folder-icons";
import { BreadcrumbNav } from "./nav/breadcrumb-nav";
import { FileTree } from "./nav/file-tree";

interface ProjectDetailClientProps {
	/** 当前打开的项目 id（来自 URL 参数） */
	projectId: string;
	/** 服务端预取的 AGENTS.md 文档列表（首屏快照） */
	agentsMds: AgentsMdListItemVo[];
	/** 服务端预解析的各文件夹图标对，按 itemId 索引 */
	iconsMap: Record<string, FolderIconPair>;
	/** 通用兜底图标对（未命中 iconsMap 时使用） */
	defaultIconPair: FolderIconPair;
}

// > 客户端交互岛屿：选中文件夹 / 阅读文档 / 展开节点均在此管理，文档树由服务端快照内存构建
export function ProjectDetailClient({
	projectId,
	agentsMds,
	iconsMap,
	defaultIconPair,
}: ProjectDetailClientProps): JSX.Element {
	const router = useRouter();
	// 由扁平文档列表按 path 前缀推导内存树（项目内文件夹不建表）
	const tree = useMemo(() => buildProjectTree(projectId, agentsMds), [projectId, agentsMds]);
	// 左侧树选中的文件夹；进入时默认选中项目根
	const [selectedFolderId, setSelectedFolderId] = useState<string>(projectId);
	// 当前阅读的文档 id；null 表示停留在文档卡片列表
	const [openedAgentsMdId, setOpenedAgentsMdId] = useState<string | null>(null);
	// 树中展开的文件夹集合（受控），面包屑跳转时补齐祖先路径
	const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([projectId]);

	// 切换文件夹（树点击或面包屑跳转）：右侧退回该文件夹的文档卡片列表，并展开目标路径上的全部祖先
	const handleFolderSelect = (folderId: string): void => {
		setSelectedFolderId(folderId);
		setOpenedAgentsMdId(null);
		setExpandedFolderIds((prev) => [...new Set([...prev, ...getPathIds(folderId)])]);
	};

	// 当前选中文件夹下的全部文档
	const folderAgentsMds = useMemo(
		() => collectFolderAgentsMds(selectedFolderId, tree, agentsMds),
		[selectedFolderId, tree, agentsMds],
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* // @ 顶部：可点击跳转的导航面包屑，阅读态末段为文档名 */}
			<BreadcrumbNav
				projectId={projectId}
				tree={tree}
				agentsMds={agentsMds}
				currentId={openedAgentsMdId ?? selectedFolderId}
				onNavigateHome={() => router.back()}
				onNavigateFolder={handleFolderSelect}
			/>
			<div className="flex min-h-0 flex-1">
				{/* // @ 左侧：文件夹树侧栏 */}
				<aside className="flex min-h-0 w-64 shrink-0 flex-col border-r">
					<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
						<FileTree
							key={projectId}
							projectId={projectId}
							tree={tree}
							agentsMds={agentsMds}
							selectedFolderId={selectedFolderId}
							expandedFolderIds={expandedFolderIds}
							onExpandedChange={setExpandedFolderIds}
							onFolderSelect={handleFolderSelect}
							iconsMap={iconsMap}
							defaultIconPair={defaultIconPair}
						/>
					</div>
				</aside>
				{/* // @ 右侧：文档卡片列表 / 文档阅读 */}
				<section className="flex min-w-0 flex-1 flex-col">
					<RightPane
						projectId={projectId}
						openedAgentsMdId={openedAgentsMdId}
						folderAgentsMds={folderAgentsMds}
						onOpenAgentsMd={setOpenedAgentsMdId}
					/>
				</section>
			</div>
		</div>
	);
}

// 右侧主体：文档阅读 / 加载中 / 空文件夹 / 卡片列表 四种状态，扁平化避免嵌套三元
const RightPane = ({
	projectId,
	openedAgentsMdId,
	folderAgentsMds,
	onOpenAgentsMd,
}: {
	projectId: string;
	openedAgentsMdId: string | null;
	folderAgentsMds: AgentsMdListItemVo[];
	onOpenAgentsMd: (agentsMdId: string) => void;
}): JSX.Element => {
	// 阅读态：取文档全文（仅打开文档时请求）
	const { data: agentsMd, isLoading } = useQuery({
		queryKey: projectKeys.agentsMdContent(projectId, openedAgentsMdId ?? ""),
		queryFn: () => client.agentsMds.getById({ projectId, id: openedAgentsMdId as string }),
		enabled: Boolean(openedAgentsMdId),
	});

	if (openedAgentsMdId) {
		if (isLoading || !agentsMd) {
			return (
				<div className="flex min-h-60 flex-1 items-center justify-center">
					<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
				</div>
			);
		}
		return (
			<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
				<pre className="whitespace-pre-wrap px-6 py-4 font-mono text-sm leading-6">
					{agentsMd.content}
				</pre>
			</div>
		);
	}

	if (folderAgentsMds.length === 0) {
		return <EmptyState icon={Icons.agentsMd} description="该文件夹下还没有 AGENTS.md 文档" />;
	}

	return (
		<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
			<div className="px-6 py-4">
				<AgentsMdCardGrid agentsMds={folderAgentsMds} onOpen={onOpenAgentsMd} />
			</div>
		</div>
	);
};
