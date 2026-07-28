"use client";

// # 个人 AGENTS.md 页：首页项目卡片 → 项目内左侧文件夹树 + 右侧文档卡片 → 点卡片阅读文档

import type { JSX } from "react";
import { useState } from "react";

import { Icons } from "@/shared/ui/icons";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { State } from "@/widgets/empty-state";
import { TitlePageShell, WidthWrapper } from "@/widgets/page-shell";
import {
	agentsTreeItems,
	collectAgentsDocs,
	collectProjects,
	getPathIds,
} from "../model/mock-tree";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { DocCardGrid } from "./doc-cards";
import { FileTree } from "./file-tree";
import { ProjectCardGrid } from "./project-cards";

export function PersonalAgentsMdPage(): JSX.Element {
	// 当前打开的项目；null 表示停留在首页项目列表
	const [openedProjectId, setOpenedProjectId] = useState<string | null>(null);
	// 项目内左侧树选中的文件夹
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
	// 当前阅读的文档 id；null 表示停留在文档卡片列表
	const [openedFileId, setOpenedFileId] = useState<string | null>(null);
	// 树中展开的文件夹集合（受控），面包屑跳转时在此补齐祖先路径
	const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);

	// 进入项目：默认选中并展开项目根文件夹
	const handleProjectOpen = (projectId: string): void => {
		setOpenedProjectId(projectId);
		setSelectedFolderId(projectId);
		setOpenedFileId(null);
		setExpandedFolderIds([projectId]);
	};

	// 返回首页项目列表，清空项目内状态
	const handleBackToProjects = (): void => {
		setOpenedProjectId(null);
		setSelectedFolderId(null);
		setOpenedFileId(null);
		setExpandedFolderIds([]);
	};

	// 切换文件夹（树点击或面包屑跳转）：右侧退回该文件夹的文档卡片列表，并展开目标路径上的全部祖先
	const handleFolderSelect = (folderId: string): void => {
		setSelectedFolderId(folderId);
		setOpenedFileId(null);
		setExpandedFolderIds((prev) => [...new Set([...prev, ...getPathIds(folderId)])]);
	};

	// @ 首页：项目卡片列表
	if (!openedProjectId) {
		return (
			<TitlePageShell title="AGENTS.md">
				<WidthWrapper>
					<ProjectCardGrid projects={collectProjects()} onOpen={handleProjectOpen} />
				</WidthWrapper>
			</TitlePageShell>
		);
	}

	// @ 项目内视图：顶部面包屑 + 左侧文件夹树 + 右侧文档卡片 / 阅读
	const openedFile = openedFileId ? agentsTreeItems[openedFileId] : null;
	const isReading = Boolean(openedFileId && openedFile?.content);
	const currentFolderId = selectedFolderId ?? openedProjectId;
	const docs = collectAgentsDocs(currentFolderId);

	// 右侧主体：文档阅读 / 空文件夹 / 卡片列表 三种状态，扁平化避免嵌套三元
	const renderRightPane = (): JSX.Element => {
		if (isReading && openedFile?.content) {
			return (
				<ScrollArea className="min-h-0 flex-1">
					<pre className="whitespace-pre-wrap px-6 py-4 font-mono text-sm leading-6">
						{openedFile.content}
					</pre>
				</ScrollArea>
			);
		}
		if (docs.length === 0) {
			return <State icon={Icons.agentsMd} description="该文件夹下还没有 AGENTS.md 文档" />;
		}
		return (
			<ScrollArea className="h-full">
				<div className="px-6 py-4">
					<DocCardGrid docs={docs} onOpen={setOpenedFileId} />
				</div>
			</ScrollArea>
		);
	};

	return (
		<TitlePageShell title="AGENTS.md" scrollable={false}>
			<div className="flex min-h-0 flex-1 flex-col">
				{/* // @ 顶部：可点击跳转的导航面包屑，阅读态末段为文档名 */}
				<BreadcrumbNav
					currentId={isReading && openedFileId ? openedFileId : currentFolderId}
					onNavigateHome={handleBackToProjects}
					onNavigateFolder={handleFolderSelect}
				/>
				<div className="flex min-h-0 flex-1">
					{/* // @ 左侧：文件夹树侧栏 */}
					<aside className="w-64 shrink-0 border-r">
						<ScrollArea className="h-full">
							<FileTree
								key={openedProjectId}
								projectId={openedProjectId}
								selectedFolderId={currentFolderId}
								expandedFolderIds={expandedFolderIds}
								onExpandedChange={setExpandedFolderIds}
								onFolderSelect={handleFolderSelect}
							/>
						</ScrollArea>
					</aside>
					{/* // @ 右侧：文档卡片列表 / 文档阅读 */}
					<section className="flex min-w-0 flex-1 flex-col">{renderRightPane()}</section>
				</div>
			</div>
		</TitlePageShell>
	);
}
