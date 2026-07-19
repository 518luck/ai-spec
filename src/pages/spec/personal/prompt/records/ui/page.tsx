"use client";

import { useSession } from "next-auth/react";
import { type JSX, useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { getRecords } from "@/entities/prompt";
import { FolderCombobox } from "@/features/folder-combobox";
import { SearchInput } from "@/features/search-input";
import { TagCombobox } from "@/features/tag-combobox";
import { useInView } from "@/shared/hooks";
import type { ListRecordsDto, RecordListVo } from "@/shared/lib/zod/schemas/prompt/record";
import { Button } from "@/shared/ui/button";
import { CenteredLoader } from "@/shared/ui/centered-loader";
import { HelpTooltip } from "@/shared/ui/help-tooltip";
import { Icons } from "@/shared/ui/icons";
import { Kbd } from "@/shared/ui/kbd";
import { EmptyState } from "@/widgets/empty-state";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { InfiniteListFooter } from "../../shared/ui/infinite-list-footer";
import { RecordsMutateProvider } from "../model/records-mutate-context";
import { CreateRecordDialog } from "./create-record-dialog";
import { RecordsGrid } from "./records-grid";

// # 个人收录页：SWR Infinite 拉取 GET /api/prompt/records，底部哨兵进入视口时自动加载下一页
export function PersonalRecordsPage({ folderId, tagIds, q, filter }: ListRecordsDto): JSX.Element {
	const { status } = useSession();
	const [createOpen, setCreateOpen] = useState(false);

	// SWR Infinite key：folderId/tagIds/q/filter 任一变化自动重置到第一页；上一页无更多数据时返回 null 停止加载
	const getKey = (_pageIndex: number, previousPageData: RecordListVo | null) => {
		if (status !== "authenticated") return null;
		if (previousPageData && !previousPageData.hasMore) return null;
		const offset = previousPageData?.nextOffset ?? 0;
		return ["records", folderId, tagIds, q, filter, offset] as const;
	};

	const {
		data,
		isLoading,
		isValidating,
		setSize,
		mutate: mutateRecords,
	} = useSWRInfinite(getKey, async ([, folderId, tagIds, q, filter, offset]) =>
		getRecords({ folderId, tagIds, q, filter, offset }),
	);

	const records = useMemo(() => data?.flatMap((page) => page.data) ?? [], [data]);
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
	const renderRecordsBody = (): JSX.Element => {
		if (isLoading) {
			return <CenteredLoader />;
		}
		if (total === 0) {
			return <EmptyState icon={Icons.prompt} description="还没有收录，把常用提示词归档进来吧" />;
		}
		return (
			<>
				<RecordsGrid records={records} />
				<InfiniteListFooter
					hasMore={hasMore}
					hasPaged={hasPaged}
					isValidating={isValidating}
					sentinelRef={sentinelRef}
					endText="到底了，没有更多收录了"
				/>
			</>
		);
	};

	return (
		// > 包裹 RecordsMutateProvider：让子树（创建弹窗）能通过 useSWRInfinite 的 bound mutate 重拉列表
		<RecordsMutateProvider mutate={() => mutateRecords()}>
			<ToolbarPageShell
				title="收录"
				help={<HelpTooltip content="高频提示词归档处，一点即复制发给 AI" />}
				filter={<FolderCombobox resourceType="promptRecord" />}
				actions={
					status === "authenticated" ? (
						<>
							<Button
								size="sm"
								variant="outline"
								onClick={() => setCreateOpen(true)}
								className="gap-2"
							>
								创建收录
								<Kbd alignWithText hideOnNarrow>
									C
								</Kbd>
							</Button>
							<CreateRecordDialog open={createOpen} onOpenChange={setCreateOpen} />
						</>
					) : undefined
				}
			>
				<PageWidthWrapper fill>
					{/* // @ 筛选条带：标签贴左、搜索框贴右；始终展示，避免切换筛选时组件卸载丢状态 */}
					<div className="mb-6 flex items-center justify-between gap-3">
						<TagCombobox resourceType="promptRecord" />
						<SearchInput
							className="max-w-80"
							filters={["title", "content"]}
							defaultFilter="title"
						/>
					</div>
					{renderRecordsBody()}
				</PageWidthWrapper>
			</ToolbarPageShell>
		</RecordsMutateProvider>
	);
}
