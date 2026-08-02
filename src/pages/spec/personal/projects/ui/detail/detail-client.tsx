"use client";

// # 项目内视图客户端容器：持有选中/展开/阅读状态，渲染面包屑 + 文件夹树 + 配置区

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { useSessionStorage } from "@/shared/hooks";
import type { AgentsMdListItemVo, ProjectFolderListItemVo } from "@/shared/lib/zod/schemas/project";
import {
	buildProjectTree,
	collectFolderAgentsMds,
	getFolderAncestorIds,
} from "../../model/path-utils";
import { RightPane } from "./content/right-pane";
import type { FolderIconPair } from "./folder-icons";
import { BreadcrumbNav } from "./nav/breadcrumb-nav";
import { FileTree } from "./nav/file-tree";
import { SidebarResizeHandle } from "./nav/sidebar-resize-handle";

interface ProjectDetailClientProps {
	/** 当前打开的项目 id（来自 URL 参数） */
	projectId: string;
	/** 项目名，作为树根的显示名 */
	projectName: string;
	/** 服务端预取的 AGENTS.md 配置列表（含多对多挂载关系） */
	agentsMds: AgentsMdListItemVo[];
	/** 服务端预取的文件夹列表（parentId 自关联树） */
	projectFolders: ProjectFolderListItemVo[];
	/** 项目根文件夹 id（parentId=null 的记录）：树第一行与顶层挂载点 */
	rootFolderId: string;
	/** 服务端预解析的各文件夹图标对，按 itemId 索引 */
	iconsMap: Record<string, FolderIconPair>;
	/** 通用兜底图标对（未命中 iconsMap 时使用） */
	defaultIconPair: FolderIconPair;
}

// > 客户端交互岛屿：选中文件夹 / 阅读配置 / 展开节点均在此管理，配置树由服务端快照内存构建
export function ProjectDetailClient({
	projectId,
	projectName,
	agentsMds,
	projectFolders,
	rootFolderId,
	iconsMap,
	defaultIconPair,
}: ProjectDetailClientProps): JSX.Element {
	const router = useRouter();
	// 由文件夹表与配置挂载关系构建内存树；项目根文件夹显示项目名
	const tree = useMemo(
		() => buildProjectTree(projectFolders, agentsMds, rootFolderId, projectName),
		[projectFolders, agentsMds, rootFolderId, projectName],
	);
	// 左侧树选中的文件夹；进入时默认选中项目根文件夹
	const [selectedFolderId, setSelectedFolderId] = useState<string>(rootFolderId);
	// 当前阅读的配置 id；null 表示停留在配置卡片列表
	const [openedAgentsMdId, setOpenedAgentsMdId] = useState<string | null>(null);
	// 树中展开的文件夹集合（受控），面包屑跳转时补齐祖先路径
	// > 存 sessionStorage（按项目隔离），刷新后恢复展开状态，关标签页清空
	const [expandedFolderIds, setExpandedFolderIds] = useSessionStorage<string[]>(
		`project:${projectId}:expanded`,
		[rootFolderId],
	);
	// 文件夹树侧栏宽度（px）：会话级持久化、全局生效（VSCode 拖拽调宽后保持）
	const [sidebarWidth, setSidebarWidth] = useSessionStorage<number>(
		"projects:detail:sidebarWidth",
		256,
	);

	// 切换文件夹（树点击或面包屑跳转）：右侧退回该文件夹的配置卡片列表，并展开目标路径上的全部祖先
	const handleFolderSelect = (folderId: string): void => {
		setSelectedFolderId(folderId);
		setOpenedAgentsMdId(null);
		setExpandedFolderIds((prev) => [
			...new Set([...prev, ...getFolderAncestorIds(folderId, tree)]),
		]);
	};

	// 创建文件/文件夹成功后的联动：展开新路径祖先，文件夹创建后选中它（右侧联动），再刷新服务端数据
	const handleCreated = (id: string, kind: "file" | "folder"): void => {
		if (kind === "folder") {
			setExpandedFolderIds((prev) => [...new Set([...prev, ...getFolderAncestorIds(id, tree)])]);
			setSelectedFolderId(id);
			setOpenedAgentsMdId(null);
		}
		// 创建文件时父文件夹即当前选中项（已展开），无需额外展开
		// RSC 预取快照模式：router.refresh() 触发服务端重新执行预取，树/卡片拿到最新数据
		router.refresh();
	};

	// 删除文件夹成功后的联动：若删的是当前选中文件夹则回退选中其父（无父回根），再刷新服务端数据
	const handleDeleted = (folderId: string, parentId: string | null): void => {
		if (selectedFolderId === folderId) {
			setSelectedFolderId(parentId ?? rootFolderId);
			setOpenedAgentsMdId(null);
			setExpandedFolderIds((prev) => prev.filter((id) => id !== folderId));
		}
		router.refresh();
	};

	// 当前选中文件夹下的全部配置
	const folderAgentsMds = useMemo(
		() => collectFolderAgentsMds(selectedFolderId, tree, agentsMds),
		[selectedFolderId, tree, agentsMds],
	);

	// 文件夹 id → 名称映射（卡片底部标注挂载位置用）
	const folderNames = useMemo(
		() => Object.fromEntries(projectFolders.map((folder) => [folder.id, folder.name])),
		[projectFolders],
	);

	return (
		<div className="flex min-h-0 flex-1">
			{/* // @ 左侧：文件夹树侧栏（宽度可拖拽调整，VSCode 风格；会话级持久化） */}
			<aside
				data-slot="detail-sidebar"
				className="relative flex min-h-0 shrink-0 flex-col border-r"
				style={{ width: sidebarWidth }}
			>
				<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
					{/* 数据指纹作 key：创建/刷新后数量变化即重挂载，headless-tree 受控模式下数据变化
					    不会刷新已展开节点的子列表，重挂载让新节点立即可见 */}
					<FileTree
						key={`${projectId}:${projectFolders.length}:${agentsMds.length}`}
						projectId={projectId}
						tree={tree}
						agentsMds={agentsMds}
						selectedFolderId={selectedFolderId}
						expandedFolderIds={expandedFolderIds}
						onExpandedChange={setExpandedFolderIds}
						onFolderSelect={handleFolderSelect}
						onCreated={handleCreated}
						onDeleted={handleDeleted}
						iconsMap={iconsMap}
						defaultIconPair={defaultIconPair}
					/>
				</div>
				{/* // 缩放手柄：贴 aside 右边缘，拖拽调整文件夹树宽度 */}
				<SidebarResizeHandle width={sidebarWidth} onWidthChange={setSidebarWidth} />
			</aside>
			{/* // @ 右侧内容区：顶部导航面包屑（阅读态末段为配置名）+ 配置卡片列表 / 配置阅读 */}
			<section className="flex min-w-0 flex-1 flex-col">
				<BreadcrumbNav
					tree={tree}
					agentsMds={agentsMds}
					currentId={openedAgentsMdId ?? selectedFolderId}
					onNavigateHome={() => router.back()}
					onNavigateFolder={handleFolderSelect}
				/>
				<RightPane
					projectId={projectId}
					openedAgentsMdId={openedAgentsMdId}
					folderAgentsMds={folderAgentsMds}
					folderNames={folderNames}
					onOpenAgentsMd={setOpenedAgentsMdId}
				/>
			</section>
		</div>
	);
}
