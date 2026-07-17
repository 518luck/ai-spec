"use client";

import { useSession } from "next-auth/react";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { getDrafts } from "@/entities/prompt";
import { SearchInput } from "@/features/search-input";
import { useInView } from "@/shared/hooks";
import type { DraftListVo, ListDraftsDto } from "@/shared/lib/zod/schemas/prompt/draft";
import { Button } from "@/shared/ui/button";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { Kbd } from "@/shared/ui/kbd";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { EmptyState } from "@/widgets/empty-state";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { DraftsMutateProvider } from "../model/drafts-mutate-context";
import { CreateDraftDialog } from "./create-draft-dialog";
import { DraftFolderFilter } from "./draft-folder-filter";
import { DraftsGrid } from "./drafts-grid";

// # 个人草稿页：SWR Infinite 拉取 GET /api/prompt/drafts，底部哨兵进入视口时自动加载下一页
export function PersonalDraftsPage({ q, filter, sort, folderId }: ListDraftsDto): JSX.Element {
	const { status } = useSession();
	const [createOpen, setCreateOpen] = useState(false);

	// SWR Infinite key：q/filter/sort/folderId 任一变化自动重置到第一页；上一页无更多数据时返回 null 停止加载
	const getKey = (_pageIndex: number, previousPageData: DraftListVo | null) => {
		if (status !== "authenticated") return null;
		if (previousPageData && !previousPageData.hasMore) return null;
		const offset = previousPageData?.nextOffset ?? 0;
		return ["drafts", q, filter, sort, folderId, offset] as const;
	};

	const {
		data,
		isLoading,
		isValidating,
		setSize,
		mutate: mutateDrafts,
	} = useSWRInfinite(getKey, async ([, q, filter, sort, folderId, offset]) =>
		getDrafts({ q, filter, sort, folderId, offset }),
	);

	const drafts = useMemo(() => data?.flatMap((page) => page.data) ?? [], [data]);
	const total = data?.[0]?.total ?? 0;
	const hasMore = data?.[data.length - 1]?.hasMore ?? false;

	// 底部哨兵进入视口且还有下一页、未在加载中时，自动加载下一页
	const { ref: sentinelRef, inView } = useInView({ threshold: 0 });
	useEffect(() => {
		if (inView && hasMore && !isValidating) {
			void setSize((s) => s + 1);
		}
	}, [inView, hasMore, isValidating, setSize]);

	return (
		// > 包裹 DraftsMutateProvider：让子树（卡片删除/新建/编辑弹窗）能通过 useSWRInfinite 的 bound mutate 重拉列表
		<DraftsMutateProvider mutate={() => mutateDrafts()}>
			<ToolbarPageShell
				title="草稿"
				help={<HelpTooltip content="随手记录灵感，转正后进入收录库管理版本与标签" />}
				filter={<DraftFolderFilter />}
				search={<SearchInput className="w-64" filters={["title", "content"]} />}
				actions={
					status === "authenticated" ? (
						<>
							<Button
								size="sm"
								variant="outline"
								onClick={() => setCreateOpen(true)}
								className="gap-2"
							>
								新建草稿
								<Kbd alignWithText>C</Kbd>
							</Button>
							<CreateDraftDialog open={createOpen} onOpenChange={setCreateOpen} />
						</>
					) : undefined
				}
			>
				<PageWidthWrapper fill>
					{isLoading ? (
						<div className="flex justify-center py-20 text-muted-foreground">
							<ScaleLoaderWrap />
						</div>
					) : total === 0 ? (
						<EmptyState icon={Icons.prompt} description="还没有草稿，随手记下你的灵感吧" />
					) : (
						<>
							<DraftsGrid drafts={drafts} />
							{hasMore ? (
								<>
									<div ref={sentinelRef} className="h-4" />
									{isValidating && (
										<div className="flex justify-center py-6 text-muted-foreground">
											<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
										</div>
									)}
								</>
							) : (
								<div className="flex justify-center py-6 text-muted-foreground text-sm">
									到底了，没有更多草稿了
								</div>
							)}
						</>
					)}
				</PageWidthWrapper>
			</ToolbarPageShell>
		</DraftsMutateProvider>
	);
}
