"use client";

// # 项目内视图客户端容器：持有选中/展开/阅读状态，渲染面包屑 + 文件夹树 + 文档区

import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useState } from "react";

import { Icons } from "@/shared/ui/icons";
import { EmptyState } from "@/widgets/empty-state";
import { agentsTreeItems, collectAgentsDocs, getPathIds } from "../../model/mock-tree";
import { AgentsDocCardGrid } from "./agents-doc-cards";
import type { FolderIconPair } from "./folder-icons";
import { BreadcrumbNav } from "./nav/breadcrumb-nav";
import { FileTree } from "./nav/file-tree";

interface ProjectDetailClientProps {
	/** 当前打开的项目 id（来自 URL 参数） */
	projectId: string;
	/** 服务端预解析的各文件夹图标对，按 itemId 索引 */
	iconsMap: Record<string, FolderIconPair>;
	/** 通用兜底图标对（未命中 iconsMap 时使用） */
	defaultIconPair: FolderIconPair;
}

// > 客户端交互岛屿：选中文件夹 / 阅读文档 / 展开节点均在此管理，图标对由服务端预解析传入
export function ProjectDetailClient({
	projectId,
	iconsMap,
	defaultIconPair,
}: ProjectDetailClientProps): JSX.Element {
	const router = useRouter();
	// 左侧树选中的文件夹；进入时默认选中项目根
	const [selectedFolderId, setSelectedFolderId] = useState<string>(projectId);
	// 当前阅读的文档 id；null 表示停留在文档卡片列表
	const [openedFileId, setOpenedFileId] = useState<string | null>(null);
	// 树中展开的文件夹集合（受控），面包屑跳转时补齐祖先路径
	const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([projectId]);

	// 切换文件夹（树点击或面包屑跳转）：右侧退回该文件夹的文档卡片列表，并展开目标路径上的全部祖先
	const handleFolderSelect = (folderId: string): void => {
		setSelectedFolderId(folderId);
		setOpenedFileId(null);
		setExpandedFolderIds((prev) => [...new Set([...prev, ...getPathIds(folderId)])]);
	};

	const openedFile = openedFileId ? agentsTreeItems[openedFileId] : null;
	const isReading = Boolean(openedFileId && openedFile?.content);
	const docs = collectAgentsDocs(selectedFolderId);

	// 右侧主体：文档阅读 / 空文件夹 / 卡片列表 三种状态，扁平化避免嵌套三元
	const renderRightPane = (): JSX.Element => {
		if (isReading && openedFile?.content) {
			return (
				<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
					<pre className="whitespace-pre-wrap px-6 py-4 font-mono text-sm leading-6">
						{openedFile.content}
					</pre>
				</div>
			);
		}
		if (docs.length === 0) {
			return <EmptyState icon={Icons.agentsMd} description="该文件夹下还没有 AGENTS.md 文档" />;
		}
		return (
			<div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
				<div className="px-6 py-4">
					<AgentsDocCardGrid docs={docs} onOpen={setOpenedFileId} />
				</div>
			</div>
		);
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* // @ 顶部：可点击跳转的导航面包屑，阅读态末段为文档名 */}
			<BreadcrumbNav
				currentId={isReading && openedFileId ? openedFileId : selectedFolderId}
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
				<section className="flex min-w-0 flex-1 flex-col">{renderRightPane()}</section>
			</div>
		</div>
	);
}
