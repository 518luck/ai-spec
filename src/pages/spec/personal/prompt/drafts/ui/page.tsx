"use client";

import { useSession } from "next-auth/react";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { getDrafts } from "@/entities/prompt";
import { FolderCombobox } from "@/features/folder-combobox";
import { SearchInput } from "@/features/search-input";
import { useInView } from "@/shared/hooks";
import type { DraftListVo, ListDraftsDto } from "@/shared/lib/zod/schemas/prompt/draft";
import { Button } from "@/shared/ui/button";
import { CenteredLoader } from "@/shared/ui/centered-loader";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { Kbd } from "@/shared/ui/kbd";
import { EmptyState } from "@/widgets/empty-state";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { InfiniteListFooter } from "../../shared/ui/infinite-list-footer";
import { DraftsMutateProvider } from "../model/drafts-mutate-context";
import { CreateDraftDialog } from "./create-draft-dialog";
import { DraftsGrid } from "./drafts-grid";

// # 个人草稿页：SWR Infinite 拉取 GET /api/prompt/drafts，底部哨兵进入视口时自动加载下一页
export function PersonalDraftsPage({ q, filter, folderId }: ListDraftsDto): JSX.Element {
	const { status } = useSession();
	const [createOpen, setCreateOpen] = useState(false);

	// SWR Infinite key：q/filter/folderId 任一变化自动重置到第一页；上一页无更多数据时返回 null 停止加载
	const getKey = (_pageIndex: number, previousPageData: DraftListVo | null) => {
		if (status !== "authenticated") return null;
		if (previousPageData && !previousPageData.hasMore) return null;
		const offset = previousPageData?.nextOffset ?? 0;
		return ["drafts", q, filter, folderId, offset] as const;
	};

	const {
		data,
		isLoading,
		isValidating,
		setSize,
		mutate: mutateDrafts,
	} = useSWRInfinite(getKey, async ([, q, filter, folderId, offset]) =>
		getDrafts({ q, filter, folderId, offset }),
	);

	const drafts = useMemo(() => data?.flatMap((page) => page.data) ?? [], [data]);
	const total = data?.[0]?.total ?? 0;
	const hasMore = data?.[data.length - 1]?.hasMore ?? false;
	// 已加载页数 > 1 表示翻过页；短列表首页即到底时为 false，配合 hasMore 判断是否渲染底部 footer
	const hasPaged = (data?.length ?? 0) > 1;

	// 底部哨兵进入视口且还有下一页、未在加载中时，自动加载下一页
	const { ref: sentinelRef, inView } = useInView({ threshold: 0 });
	useEffect(() => {
		if (inView && hasMore && !isValidating) {
			void setSize((s) => s + 1);
		}
	}, [inView, hasMore, isValidating, setSize]);

	// 列表主体：首屏 loading / 空状态 / 网格 + 无限滚动底部分三种状态，扁平化避免嵌套三元
	const renderDraftsBody = (): JSX.Element => {
		if (isLoading) {
			return <CenteredLoader />;
		}
		if (total === 0) {
			return <EmptyState icon={Icons.prompt} description="还没有草稿，随手记下你的灵感吧" />;
		}
		return (
			<>
				<DraftsGrid drafts={drafts} />
				<InfiniteListFooter
					hasMore={hasMore}
					hasPaged={hasPaged}
					isValidating={isValidating}
					sentinelRef={sentinelRef}
					endText="到底了，没有更多草稿了"
				/>
			</>
		);
	};

	return (
		// > 包裹 DraftsMutateProvider：让子树（卡片删除/新建/编辑弹窗）能通过 useSWRInfinite 的 bound mutate 重拉列表
		<DraftsMutateProvider mutate={() => mutateDrafts()}>
			<ToolbarPageShell
				title="草稿"
				help={<HelpTooltip content="随手记录灵感，转正后进入收录库管理版本与标签" />}
				filter={<FolderCombobox resourceType="promptDraft" />}
				search={
					// // > max-w-80 上限 320px、w-full 跟随父级弹性收缩，避免窄窗口标题栏溢出
					// // > -translate-x-20 纯视觉偏移，让搜索框整体向左挪一点，不改变 flex 布局
					<SearchInput
						className="w-full max-w-80 -translate-x-20"
						filters={["title", "content"]}
						defaultFilter="title"
					/>
				}
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
								<Kbd alignWithText hideOnNarrow>
									C
								</Kbd>
							</Button>
							<CreateDraftDialog open={createOpen} onOpenChange={setCreateOpen} />
						</>
					) : undefined
				}
			>
				<PageWidthWrapper fill>{renderDraftsBody()}</PageWidthWrapper>
			</ToolbarPageShell>
		</DraftsMutateProvider>
	);
}
