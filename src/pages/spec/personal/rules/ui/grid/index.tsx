"use client";

// # 规约卡片容器：useInfiniteQuery 无限滚动 + 加载/空态 + 渲染卡片网格
// > 哨兵进入视口自动加载下一页，数据请求和状态管理内聚在此

import { useInfiniteQuery } from "@tanstack/react-query";
import { type JSX, useMemo } from "react";

import { useInfiniteLoad } from "@/shared/hooks";
import { client } from "@/shared/lib/orpc/client";
import { ruleKeys } from "@/shared/lib/orpc/query-keys";
import { Icons } from "@/shared/ui/icons";
import { InfiniteListFooter } from "@/shared/ui/infinite-list-footer";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { EmptyAction } from "@/widgets/empty-state";
import { RuleGrid } from "./grid";

// 卡片无限滚动每页条数
const PAGE_SIZE = 50;

type RuleGridContainerProps = {
	folderId?: string;
	spaceId?: string;
	tagIds?: string;
	q?: string;
	onCreate?: () => void;
};

// > 卡片容器：负责无限滚动数据请求和加载状态
export function RuleGridContainer({
	folderId,
	spaceId,
	tagIds,
	q,
	onCreate,
}: RuleGridContainerProps): JSX.Element {
	const {
		data: infiniteData,
		isLoading,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	} = useInfiniteQuery({
		queryKey: ruleKeys.infinite({ folderId, spaceId, tagIds, q }),
		// pageParam 0-based，API 用 1-based
		queryFn: ({ pageParam }) =>
			client.rules.list({
				folderId,
				spaceId,
				tagIds,
				q,
				page: pageParam + 1,
				pageSize: PAGE_SIZE,
			}),
		initialPageParam: 0,
		getNextPageParam: (lastPage, _allPages, lastPageParam) =>
			lastPage.hasMore ? lastPageParam + 1 : undefined,
	});

	const rules = useMemo(
		() => infiniteData?.pages.flatMap((page) => page.data) ?? [],
		[infiniteData],
	);
	const hasPaged = (infiniteData?.pages.length ?? 0) > 1;

	// 哨兵进入视口自动加载下一页
	const sentinelRef = useInfiniteLoad({ hasNextPage, isFetchingNextPage, fetchNextPage });

	if (isLoading) {
		return (
			<div className="flex h-60 items-center justify-center text-muted-foreground">
				<ScaleLoaderWrap height={24} width={3} margin={2} radius={2} />
			</div>
		);
	}

	if (rules.length === 0) {
		return (
			<div className="flex items-center justify-center" style={{ minHeight: 540 }}>
				<EmptyAction
					q={q}
					icon={<Icons.rulesLibrary />}
					actionLabel="新增规约"
					onAction={onCreate}
				/>
			</div>
		);
	}

	return (
		<>
			<RuleGrid rules={rules} />
			<InfiniteListFooter
				hasMore={hasNextPage}
				hasPaged={hasPaged}
				isValidating={isFetchingNextPage}
				sentinelRef={sentinelRef}
				endText="到底了，没有更多规约了"
			/>
		</>
	);
}
