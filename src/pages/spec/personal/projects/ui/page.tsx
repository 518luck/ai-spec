"use client";

// # 个人项目页：顶部搜索 + 文件夹筛选 + 项目卡片网格，点卡开右侧抽屉

import { useInfiniteQuery } from "@tanstack/react-query";
import { type JSX, useMemo, useState } from "react";
import { SearchInput } from "@/features/search-input";
import { useInfiniteLoad } from "@/shared/hooks";
import { client } from "@/shared/lib/orpc/client";
import { projectKeys } from "@/shared/lib/orpc/query-keys";
import type { SearchFilters } from "@/shared/lib/search-filter-codec";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { InfiniteListFooter } from "@/shared/ui/infinite-list-footer";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { EmptyAction } from "@/widgets/empty-state";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { ProjectCardGrid } from "./cards";
import { CreateProjectDialog } from "./create-project-dialog";
import { FolderFilterSelect } from "./folder-filter-select";
import { ProjectPreviewDrawer } from "./preview/preview-drawer";

// 卡片无限滚动每页条数
const PAGE_SIZE = 50;

type PersonalProjectsPageProps = {
	// 搜索词与字段开关来自 URL（由 SearchInput 写入），服务端解析后透传
	q?: string;
	// 搜索字段开关保留透传以维持 SearchInput 的 URL 行为；后端搜索统一 OR 匹配 name+description，前端不再用此字段过滤
	filter: SearchFilters;
};

// > 项目列表首屏：工具栏（搜索 + 文件夹筛选 + 新建）+ 卡片网格，点卡开抽屉
export function PersonalProjectsPage({
	q,
	filter: _filter,
}: PersonalProjectsPageProps): JSX.Element {
	const [folderId, setFolderId] = useState<string | null>(null);
	const [openProjectId, setOpenProjectId] = useState<string | null>(null);
	const [createOpen, setCreateOpen] = useState(false);

	// 项目列表：folderId / q 变化自动重拉；pageParam 0-based，API 用 1-based
	const {
		data: infiniteData,
		isLoading,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	} = useInfiniteQuery({
		queryKey: projectKeys.infinite({ folderId, q }),
		queryFn: ({ pageParam }) =>
			client.projects.list({
				folderId: folderId ?? undefined,
				q,
				page: pageParam + 1,
				pageSize: PAGE_SIZE,
			}),
		initialPageParam: 0,
		getNextPageParam: (lastPage, _allPages, lastPageParam) =>
			lastPage.hasMore ? lastPageParam + 1 : undefined,
	});

	const projects = useMemo(
		() => infiniteData?.pages.flatMap((page) => page.data) ?? [],
		[infiniteData],
	);

	const hasPaged = (infiniteData?.pages.length ?? 0) > 1;
	const sentinelRef = useInfiniteLoad({ hasNextPage, isFetchingNextPage, fetchNextPage });

	// 列表主体：首屏 loading / 空状态 / 网格 + 无限滚动底部分三种状态，扁平化避免嵌套三元
	const renderProjectsBody = (): JSX.Element => {
		if (isLoading) {
			return (
				<div className="flex h-60 items-center justify-center text-muted-foreground">
					<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
				</div>
			);
		}
		if (projects.length === 0) {
			return (
				<div className="flex items-center justify-center" style={{ minHeight: 540 }}>
					<EmptyAction
						q={q}
						icon={<Icons.projects />}
						actionLabel="新建项目"
						onAction={() => setCreateOpen(true)}
					/>
				</div>
			);
		}
		return (
			<>
				<ProjectCardGrid projects={projects} onOpen={setOpenProjectId} />
				<InfiniteListFooter
					hasMore={hasNextPage}
					hasPaged={hasPaged}
					isValidating={isFetchingNextPage}
					sentinelRef={sentinelRef}
					endText="到底了，没有更多项目了"
				/>
			</>
		);
	};

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
					<Button size="sm" variant="outline" className="gap-2" onClick={() => setCreateOpen(true)}>
						<Icons.plus className="size-4" />
						新建项目
					</Button>
				}
			>
				<PageWidthWrapper>{renderProjectsBody()}</PageWidthWrapper>
			</ToolbarPageShell>
			<ProjectPreviewDrawer
				projectId={openProjectId}
				onOpenChange={(open) => {
					if (open) return;
					setOpenProjectId(null);
				}}
			/>
			<CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
		</>
	);
}
