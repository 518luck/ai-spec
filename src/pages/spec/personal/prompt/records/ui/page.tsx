"use client";

import { useSession } from "next-auth/react";
import { type JSX, useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { getRecords } from "@/entities/prompt";
import { useInView } from "@/shared/hooks";
import type { RecordListVo } from "@/shared/lib/zod/schemas/prompt/record";
import { Button } from "@/shared/ui/button";
import { Icons } from "@/shared/ui/icons";
import { Kbd } from "@/shared/ui/kbd";
import { ScaleLoaderWrap } from "@/shared/ui/scale-loader";
import { EmptyState } from "@/widgets/empty-state";
import { PageWidthWrapper, ToolbarPageShell } from "@/widgets/page-shell";
import { RecordsMutateProvider } from "../model/records-mutate-context";
import { CreateRecordDialog } from "./create-record-dialog";
import { RecordsGrid } from "./records-grid";

// # 个人收录页：SWR Infinite 拉取 GET /api/prompt/records，底部哨兵进入视口时自动加载下一页
export function PersonalRecordsPage(): JSX.Element {
	const { status } = useSession();
	const [createOpen, setCreateOpen] = useState(false);

	// SWR Infinite key：上一页无更多数据时返回 null 停止加载
	const getKey = (_pageIndex: number, previousPageData: RecordListVo | null) => {
		if (status !== "authenticated") return null;
		if (previousPageData && !previousPageData.hasMore) return null;
		const offset = previousPageData?.nextOffset ?? 0;
		return ["records", offset] as const;
	};

	const {
		data,
		isLoading,
		isValidating,
		setSize,
		mutate: mutateRecords,
	} = useSWRInfinite(getKey, async ([, offset]) => getRecords({ offset }));

	const records = useMemo(() => data?.flatMap((page) => page.data) ?? [], [data]);
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
		// > 包裹 RecordsMutateProvider：让子树（创建弹窗）能通过 useSWRInfinite 的 bound mutate 重拉列表
		<RecordsMutateProvider mutate={() => mutateRecords()}>
			<ToolbarPageShell
				title="收录"
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
								<Kbd alignWithText>C</Kbd>
							</Button>
							<CreateRecordDialog open={createOpen} onOpenChange={setCreateOpen} />
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
						<EmptyState icon={Icons.prompt} description="还没有收录，把常用提示词归档进来吧" />
					) : (
						<>
							<RecordsGrid records={records} />
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
									到底了，没有更多收录了
								</div>
							)}
						</>
					)}
				</PageWidthWrapper>
			</ToolbarPageShell>
		</RecordsMutateProvider>
	);
}
