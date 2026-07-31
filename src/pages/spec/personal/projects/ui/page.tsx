"use client";

// # 个人项目页：顶部搜索 + 文件夹筛选 + 项目卡片网格，点卡开右侧抽屉

import { type JSX, useState } from "react";

import { SearchInput } from "@/features/search-input";
import type { SearchFilters } from "@/shared/lib/search-filter-codec";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { filterProjects } from "../model/mock-tree";
import { ProjectCardGrid } from "./cards";
import { FolderFilterSelect } from "./folder-filter-select";
import { ProjectPreviewDrawer } from "./preview/preview-drawer";

type PersonalProjectsPageProps = {
	// 搜索词与字段开关来自 URL（由 SearchInput 写入），服务端解析后透传
	q?: string;
	filter: SearchFilters;
};

// > 项目列表首屏：工具栏（搜索 + 文件夹筛选 + 新建）+ 卡片网格，点卡开抽屉
export function PersonalProjectsPage({ q, filter }: PersonalProjectsPageProps): JSX.Element {
	const [folderId, setFolderId] = useState<string | null>(null);
	const [openProjectId, setOpenProjectId] = useState<string | null>(null);

	const projects = filterProjects({ folderId, q, filter });

	return (
		<>
			<ToolbarPageShell
				title="项目"
				filter={<FolderFilterSelect value={folderId} onChange={setFolderId} />}
				search={
					<SearchInput
						className="w-full max-w-sm"
						filters={["title", "description"]}
						defaultFilter="title"
					/>
				}
				actions={
					<Button size="sm" variant="outline" className="gap-2">
						<Icons.plus className="size-4" />
						新建项目
					</Button>
				}
			>
				<PageWidthWrapper>
					<ProjectCardGrid projects={projects} onOpen={setOpenProjectId} />
				</PageWidthWrapper>
			</ToolbarPageShell>
			<ProjectPreviewDrawer
				projectId={openProjectId}
				onOpenChange={(open) => {
					if (!open) setOpenProjectId(null);
				}}
			/>
		</>
	);
}
