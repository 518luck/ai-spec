"use client";

// # 规约卡片容器：useSWRInfinite 无限滚动 + 加载/空态 + 渲染卡片网格
// > 哨兵进入视口自动加载下一页，数据请求和状态管理内聚在此

import { type JSX, useMemo } from "react";
import useSWRInfinite from "swr/infinite";

import { getRules } from "@/entities/rule";
import { useInfiniteLoad } from "@/shared/hooks";
import type { RuleListVo } from "@/shared/lib/zod/schemas/rule";
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
	const getKey = (_pageIndex: number, previousPageData: RuleListVo | null) => {
		if (previousPageData && !previousPageData.hasMore) return null;
		const currentOffset = previousPageData?.nextOffset ?? 0;
		return ["rules-infinite", folderId, spaceId, tagIds, q, currentOffset] as const;
	};

	const {
		data: infiniteData,
		isLoading,
		isValidating,
		setSize,
	} = useSWRInfinite(getKey, ([, folderId, spaceId, tagIds, q, offset]) =>
		getRules({ folderId, spaceId, tagIds, q, offset, limit: PAGE_SIZE }),
	);

	const rules = useMemo(() => infiniteData?.flatMap((page) => page.data) ?? [], [infiniteData]);
	const hasMore = infiniteData?.[infiniteData.length - 1]?.hasMore ?? false;
	const hasPaged = (infiniteData?.length ?? 0) > 1;

	// 哨兵进入视口自动加载下一页
	const sentinelRef = useInfiniteLoad({ hasMore, isValidating, setSize });

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
				hasMore={hasMore}
				hasPaged={hasPaged}
				isValidating={isValidating}
				sentinelRef={sentinelRef}
				endText="到底了，没有更多规约了"
			/>
		</>
	);
}
